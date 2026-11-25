"""Offline scheduler regressions. Fixtures below do not call subscription services."""
import json
import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import providers
import runner


class QueueTest(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.folder = Path(temp.name)
        self.work = self.folder/'work'
        self.work.mkdir()
        subprocess.run(['git','init','-q',str(self.work)],check=True)
        subprocess.run(['git','-c','user.name=Fixture','-c','user.email=test@example.invalid',
                        'commit','--allow-empty','-qm','fixture'],cwd=self.work,check=True)
        self.card = {'id':'sample','title':'인수인계','job':'pdf','services':['claude','antigravity'],'prompt':'작업을 이어가세요.'}
        self.store = runner.Store(self.folder)
        self.store.register([self.card])
        save_result = patch.object(runner,'preserve_result')
        save_result.start()
        self.addCleanup(save_result.stop)

    def test_partial_work_handoff_and_restart(self):
        partial = self.work/'first.txt'
        final = self.work/'second.txt'
        def invoke(args,**kwargs):
            if args[0]=='git':
                return real_run(args,**kwargs)
            if args[0]=='claude':
                partial.write_text('working')
                return subprocess.CompletedProcess(args,1,'{"error":"quota exceeded","retry_after":30}','')
            self.assertTrue(partial.exists())
            self.assertIn('first.txt',args[-1])
            final.write_text('finished')
            return subprocess.CompletedProcess(args,0,'{"status":"success"}','')
        def verify(*_):
            if not final.exists():
                raise ValueError('not complete')
            return 'verified'
        real_run = subprocess.run
        with patch.object(runner,'checkout',return_value=self.work), patch.object(runner.jobs,'verify',side_effect=verify), \
             patch.object(providers,'command',side_effect=lambda svc,*_:([svc],{})), patch.object(subprocess,'run',side_effect=invoke):
            runner.guarded(self.store,self.card,'claude')
            reopened = runner.Store(self.folder)
            states,services = reopened.snapshot()
            self.assertGreater(services['claude']['due'],time.time()+28)
            self.assertEqual(runner.select([self.card],states,services,{},time.time()),[(self.card,'antigravity')])
            runner.guarded(reopened,self.card,'antigravity')
            runner.guarded(reopened,self.card,'claude')
            states,services = reopened.snapshot()
            self.assertEqual(states['sample']['phase'],'done')
            self.assertEqual(runner.select([self.card],states,services,{},time.time()+36000),[])

    def test_both_wait_and_due_resume(self):
        now = time.time()
        with self.store.db() as db:
            db.execute('UPDATE services SET due=? WHERE name != ?', (now+100,'local'))
        state,svcs = runner.Store(self.folder).snapshot()
        self.assertFalse(runner.select([self.card],state,svcs,{},now))
        self.assertEqual(runner.select([self.card],state,svcs,{},now+101)[0][1],'claude')
        with self.assertRaises(providers.Waiting) as err:
            providers.interpret(1,'','network error',2)
        self.assertEqual((err.exception.kind,err.exception.delay),('transient',30))
        with self.assertRaises(providers.Waiting) as err:
            providers.interpret(1,'{"error":{"status":"RESOURCE_EXHAUSTED","details":[{"retryDelay":"91s"}]}}','',1)
        self.assertEqual((err.exception.kind,err.exception.delay),('quota',92))

    def test_verified_phase_is_recovered_without_model(self):
        self.store.change('sample','claude','verify')
        with patch.object(runner,'checkout',return_value=self.work),patch.object(runner.jobs,'verify',return_value='ok'), \
             patch.object(providers,'command',side_effect=AssertionError('duplicate call')):
            runner.guarded(runner.Store(self.folder),self.card,'claude')
        self.assertEqual(self.store.snapshot()[0]['sample']['phase'],'done')

    def test_failed_check_blocks_dependents_and_holds_lock(self):
        self.store.change('sample','claude','verify')
        with patch.object(runner,'checkout',return_value=self.work),patch.object(runner.jobs,'verify',side_effect=ValueError('bad')):
            runner.guarded(self.store,self.card,'claude')
        states,svcs=self.store.snapshot()
        self.assertNotEqual(states['sample']['phase'],'done')
        downstream = dict(self.card, id='second',after=['sample'])
        self.store.register([downstream])
        states,svcs=self.store.snapshot()
        self.assertEqual(runner.select([self.card,downstream],states,svcs,{},time.time()),[])
        with runner.exclusive(self.folder/'sample.lock'):
            with runner.exclusive(self.folder/'sample.lock') as other:
                self.assertIsNone(other)

    def test_unmetered_transport_only(self):
        with patch.dict(os.environ,{'ANTHROPIC_API_KEY':'mock','AGY_ADC_AUTH':'true','GOOGLE_APPLICATION_CREDENTIALS':'mock'}):
            env=providers.safe_env()
            self.assertFalse({'ANTHROPIC_API_KEY','AGY_ADC_AUTH','GOOGLE_APPLICATION_CREDENTIALS'} & env.keys())
        with patch('shutil.which',return_value='agy'),patch.object(providers,'read_settings',return_value={'useG1Credits':True,'auth':{'type':'oauth-personal'}}):
            with self.assertRaises(providers.Waiting):
                providers.command('antigravity',{'antigravity'},self.work)
        with patch('shutil.which',return_value='claude'),patch.object(subprocess,'run',return_value=subprocess.CompletedProcess([],0,'{"loggedIn":true,"authMethod":"api_key"}','')):
            with self.assertRaises(providers.Waiting):
                providers.command('claude',{'claude'},self.work)
        providers.interpret(0,json.dumps({'result':'quota reached in a test'}),'',1)

    def test_personal_settings_preserve_other_keys_and_reject_cloud(self):
        with patch.object(Path,'home',return_value=self.folder):
            path=self.folder/'.gemini/antigravity-cli/settings.json'
            path.parent.mkdir(parents=True)
            path.write_text('{"colorScheme":"light","useG1Credits":true}')
            providers.configure_personal_antigravity()
            self.assertEqual(json.loads(path.read_text()),{'colorScheme':'light','useG1Credits':False,'auth':{'type':'oauth-personal'}})
            path.write_text('{"auth":{"type":"oauth-business"}}')
            with self.assertRaises(providers.Waiting):
                providers.configure_personal_antigravity()
            self.assertIn('oauth-business',path.read_text())

if __name__ == '__main__':
    unittest.main()
