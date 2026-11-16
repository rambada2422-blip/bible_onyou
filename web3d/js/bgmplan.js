/* 장면별 배경음악 표 (BO3D.bgmPlan) - 2026-11-16 Claude
 * 곡: Kevin MacLeod (incompetech.com), CC BY 4.0. 출처 표시는 story.js 시대 지도 아래 '음악 출처'.
 * 칸: story(이야기 카드) / explore(3D 둘러보기) / event(3D 사건) / after(마치는 화면)
 * 'silence' = 음악을 끈다 (OT-09 하나님이 부르시는 순간: 하나님의 목소리는 소리로 만들지 않는다) */
(function (win) {
  var root = win.BO3D = win.BO3D || {};
  root.bgmPlan = {
    "OT-01": { story: "enchanted_journey", after: "on_the_shore" },
    "OT-02": { story: "teller_tales", after: "peaceful_desolation" },
    "OT-03": { explore: "morning", event: "old_road", after: "enchanted_journey" },
    "OT-04": { story: "tabuk", after: "on_the_shore" },
    "OT-05": { explore: "desert_city", event: "enchanted_journey", after: "longing_concern" },
    "OT-06": { story: "heavy_heart", after: "on_the_shore" },
    "OT-07": { story: "enchanted_journey", after: "on_the_shore" },
    "OT-08": { story: "heavy_heart", after: "morning" },
    "OT-09": { explore: "morning", event: "silence", after: "on_the_shore" },
    "OT-10": { story: "old_road", after: "virtutes" },
    "OT-11": { explore: "tabuk", event: "old_road", after: "procession_king" },
    "OT-12": { story: "virtutes", after: "on_the_shore" },
    "OT-13": { explore: "morning", event: "enchanted_journey", after: "on_the_shore" },
    "OT-14": { story: "old_road", after: "peaceful_desolation" },
    "OT-15": { story: "tabuk", after: "peaceful_desolation" },
    "OT-16": { story: "lamentation", after: "peaceful_desolation" },
    "OT-17": { story: "old_road", after: "longing_concern" },
    "OT-18": { explore: "desert_city", event: "virtutes", after: "longing_concern" },
    "OT-19": { explore: "tabuk", event: "old_road", after: "procession_king" },
    "OT-20": { story: "virtutes", after: "on_the_shore" },
    "OT-21": { explore: "teller_tales", event: "old_road", after: "longing_concern" },
    "OT-22": { story: "old_road", after: "lamentation" },
    "OT-23": { story: "heavy_heart", after: "morning" },
    "OT-24": { story: "on_the_shore", after: "morning" },
    "OT-25": { story: "procession_king", after: "on_the_shore" },
    "OT-26": { explore: "morning", event: "old_road", after: "procession_king" },
    "OT-27": { story: "procession_king", after: "longing_concern" },
    "OT-28": { story: "virtutes", after: "on_the_shore" },
    "OT-29": { story: "old_road", after: "lamentation" },
    "OT-30": { explore: "tabuk", event: "virtutes", after: "longing_concern" },
    "OT-31": { story: "teller_tales", after: "on_the_shore" },
    "OT-32": { story: "lamentation", after: "peaceful_desolation" },
    "OT-33": { story: "heavy_heart", after: "longing_concern" },
    "OT-34": { story: "virtutes", after: "on_the_shore" },
    "OT-35": { story: "lamentation", after: "peaceful_desolation" },
    "OT-36": { explore: "teller_tales", event: "on_the_shore", after: "longing_concern" },
    "OT-37": { story: "tabuk", after: "morning" },
    "OT-38": { story: "teller_tales", after: "on_the_shore" },
    "OT-39": { explore: "tabuk", event: "virtutes", after: "procession_king" },
    "OT-40": { story: "peaceful_desolation", after: "enchanted_journey" }
  };
  /* 음악 출처 (CC BY 4.0이 요구하는 것: 제목·작가·출처·라이선스 링크·바꾼 점) */
  root.bgmCredits = {
    author: 'Kevin MacLeod (incompetech.com)',
    license: 'Licensed under Creative Commons: By Attribution 4.0 License',
    licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
    changes: 'Modified for this game: re-encoded to 80 kbps MP3, loudness normalized, fade-in/out added.',
    changesKo: '게임에 맞게 바꾼 점: 80kbps MP3로 줄이고, 음량을 고르게 맞추고, 앞뒤에 서서히 커지고 작아지게 했어요.',
    titles: ["Desert City", "Enchanted Journey", "Heavy Heart", "Lamentation", "Longing and Concern", "Morning", "Old Road", "On the Shore", "Peaceful Desolation", "Procession of the King", "Tabuk", "Teller of the Tales", "Virtutes Instrumenti"]
  };
})(typeof window !== 'undefined' ? window : this);
