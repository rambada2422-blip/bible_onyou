"""Scheduled Task entry point, launched with the current user's virtual environment."""
import os
import sys
from pathlib import Path

import runner

if __name__ == '__main__':
    dependencies = runner.DEFAULT / 'dependencies'
    os.environ['NODE_PATH'] = str(dependencies / 'node_modules')
    os.environ['PLAYWRIGHT_BROWSERS_PATH'] = str(dependencies / 'browsers')
    os.environ['PYTHONUTF8'] = '1'
    os.environ['GIT_TERMINAL_PROMPT'] = '0'
    runner.DEFAULT.mkdir(parents=True,exist_ok=True)
    # All workers inherit the diagnostic stream, even when there is no console.
    with (runner.DEFAULT/'background.log').open('a',encoding='utf-8',buffering=1) as log:
        os.dup2(log.fileno(),1)
        os.dup2(log.fileno(),2)
        sys.argv = [__file__,'watch']
        runner.main()
