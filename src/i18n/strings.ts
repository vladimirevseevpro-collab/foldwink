export type Lang = "en" | "de" | "ru";

export const SUPPORTED_LANGS: Lang[] = ["en", "de", "ru"];

export interface Strings {
  menu: {
    subtitle: string;
    playDaily: string;
    replayDaily: string;
    easy: string;
    medium: string;
    mediumLocked: string;
    masterChallenge: string;
    masterLocked: string;
    masterSoon: string;
    stats: string;
    poolSize: (n: number) => string;
    emptyPool: string;
    emptyPoolDetail: string;
    iphoneTip: string;
    iphoneTipBody: string;
    installApp: string;
    languageAria: string;
  };
  game: {
    submit: string;
    clear: string;
    shuffle: string;
    quitToMenu: string;
    quitConfirm: string;
    oneAway: string;
    noActiveGame: string;
    backToMenu: string;
    mistakesLabel: string;
    mistakesAria: (used: number, max: number) => string;
    selectedAria: (n: number, max: number) => string;
    gridAria: string;
    elapsedAria: (time: string) => string;
    solvedCardAria: (value: string, group: string) => string;
    correctGroup: string;
    incorrectGroup: string;
  };
  difficulty: {
    easy: string;
    medium: string;
    hard: string;
  };
  mode: {
    daily: string;
    standard: string;
    replay: string;
  };
  tabs: {
    label: string;
    solvedCount: (n: number, total: number) => string;
    winkReady: string;
    winkUsed: string;
    winkShort: string;
    winkConfirm: string;
    solvedAria: (name: string) => string;
    winkedAria: (name: string) => string;
    clickAria: string;
    concealedAria: string;
    tabsHintAria: string;
  };
  result: {
    noResult: string;
    backToMenu: string;
    grade: string;
    newBest: (n: number) => string;
    closeOne: string;
    /** Multi-variant loss prose — puzzle-id-seeded picker in ResultScreen
     *  gives each puzzle a consistent (non-random-feeling) flavour while
     *  avoiding the single-line repetition flagged in the audit. Keep 3–5
     *  entries per locale. */
    missedVariants: readonly string[];
    nextDaily: string;
    tryFresh: string;
    /** Multi-variant win affirmations, picked deterministically per
     *  puzzle id. Optional flavour under the grade card. Keep 3–5. */
    winAffirmations: readonly string[];
    nextPuzzle: string;
    tryMedium: string;
    showStats: string;
    subtitleDaily: (date: string) => string;
    subtitleStandard: (n: number) => string;
  };
  resultSummary: {
    solved: string;
    outOfMistakes: string;
    cleared: string;
    closeCall: string;
    time: string;
    mistakes: string;
    streak: string;
  };
  stats: {
    subtitle: string;
    solved: string;
    played: string;
    winRate: string;
    wins: string;
    losses: string;
    streak: string;
    best: string;
    depth: string;
    flawless: string;
    avgMiss: string;
    medWinRate: string;
    winks: string;
    dailyHistory: string;
    emptyRecord: string;
    emptyRecordDetail: string;
    backToMenu: string;
  };
  daily: {
    label: string;
    solved: string;
    missed: string;
    nextDailyIn: string;
    noHistoryYet: string;
    solvedShort: string;
    failedShort: string;
    foldSolved: string;
    foldCracked: string;
    foldRestored?: string;
    foldMissed: string;
    foldEmpty: string;
    graceWaxApplied: string;
    todayMarker: string;
    momentLabel: string;
    momentFirst: string;
    momentFlawless: string;
    momentLogged: string;
    momentFastest: (time: string) => string;
    momentFastestCompared: (time: string, date: string) => string;
    recentSummary: (solved: number, recorded: number) => string;
  };
  share: {
    shareResult: string;
    preparing: string;
    copied: string;
    savedImage: string;
    unavailable: string;
    shareTextSolvedLine: (time: string, mistakes: number) => string;
    shareTextOutLine: (mistakes: number) => string;
    shareTextFooter: string;
  };
  readiness: {
    almostThere: string;
    moreEasyWins: (n: number) => string;
    warmingUp: string;
    mediumUnlocksAt: (current: number, target: number) => string;
    mediumReady: string;
    tabsFeelNatural: string;
    recommended: string;
    goodNextStep: string;
    mediumUnlocked: string;
    tryWhenReady: string;
    toughMediums: string;
    masterChallenge: string;
    masterLocked: string;
    hardComingSoon: string;
    moreMediumWins: (n: number) => string;
    youAreReady: string;
    slowerRevealsNoWink: string;
    toughStretch: string;
  };
  settings: {
    soundOn: string;
    soundOff: string;
    hapticsOn: string;
    hapticsOff: string;
  };
  about: {
    link: string;
    title: string;
    close: string;
    closeAria: string;
    bylineBy: string;
    bylineAfter: string;
    privacy: string;
    privacyBody: string;
    support: string;
    supportBody: string;
    clearEventLog: string;
    eventLogCleared: string;
    resetAll: string;
    resetArmed: string;
    resetAria: string;
  };
  onboarding: {
    howToPlay: string;
    progressAria: string;
    stepLabel: (current: number, total: number) => string;
    selectTitle: string;
    selectBody: string;
    selectedCount: (selected: number, total: number) => string;
    demoCards: readonly string[];
    demoGroupAria: string;
    submitTitle: string;
    submitBody: string;
    correctGroup: string;
    continueAction: string;
    tabsTitle: string;
    tabsHint: string;
    tabsBody: string;
    demoTabs: readonly string[];
    demoCategory: string;
    wink: string;
    winkAria: string;
    winkPrompt: string;
    winkResult: string;
    skip: string;
    gotIt: string;
    menuLink: string;
    guildTitle: string;
    guildBody: string;
  };
  embed: {
    fullSizeTitle: string;
    fullSizeBody: string;
    openFullSize: string;
    continueHere: string;
  };
  monetization: {
    tipCta: (amount: number) => string;
    supporterHeadlineResult: string;
    supporterHeadlineStats: string;
    supporterHeadlineMenu: string;
    supporterSublineResult: (price: string) => string;
    supporterSublineAmbient: (price: string) => string;
    unlockFor: (price: string) => string;
    badgeLabel: string;
    badgeTitle: string;
  };
  duel: {
    bannerTitle: string;
    youWon: string;
    challengerWon: string;
    tie: string;
    yourResult: string;
    challengerResult: string;
    sendResponse: string;
    responseSent: string;
    challengeFriend: string;
    challengeCopied: string;
    mistakesWord: (n: number) => string;
  };
  passport: {
    diffTitle: string;
    currentProfile: string;
    importedProfile: string;
    replaceConfirm: string;
    undoImport: string;
    undoSuccess: string;
    statLevel: string;
    statXp: string;
    statStreak: string;
    statInk: string;
    statWax: string;
    statStamps: string;
    preservedStreak: string;
    sealPassport: string;
    importSeal: string;
    downloadPng: string;
    copyCode: string;
    sealCopied: string;
    verifiedSeal: string;
    officialTitle: string;
    waxSealLabel: string;
    scribeNibLabel: string;
    ironContractCta: string;
    tabPassport: string;
    tabStamps: string;
    stampsCount: (collected: number, total: number) => string;
  };
  palimpsest: {
    menuButton: string;
    title: string;
    subtitle: string;
    obverseBadge: string;
    reverseBadge: string;
    obverseCompleteTitle: string;
    obverseCompleteDesc: string;
    flipButton: string;
    completedTitle: string;
    completedDetail: string;
    doubleSealBadge: string;
    archivalReward: string;
    rulesHint: string;
    backToMenu: string;
    outOfMistakesTitle: string;
    outOfMistakesDesc: string;
    retryLayer: string;
    openPassport: string;
    recordedInPassport: string;
  };
}

export const strings: Record<Lang, Strings> = {
  en: {
    menu: {
      subtitle: "Find 4 hidden groups of 4 · 2–5 minutes",
      playDaily: "Play today's puzzle",
      replayDaily: "Replay daily",
      easy: "Easy puzzle",
      medium: "Medium puzzle",
      mediumLocked: "Medium — locked",
      masterChallenge: "Master Challenge",
      masterLocked: "Master Challenge — locked",
      masterSoon: "Master Challenge — soon",
      stats: "Stats",
      poolSize: (n) => `${n} puzzles`,
      emptyPool: "Empty pool",
      emptyPoolDetail:
        "No puzzles are bundled in this build. Drop JSON files into puzzles/pool/ and rebuild.",
      iphoneTip: "✦ iPhone tip",
      iphoneTipBody:
        "Tap Safari's Share button, then Add to Home Screen for a cleaner full-screen play.",
      installApp: "Install Foldwink",
      languageAria: "Language",
    },
    game: {
      submit: "Submit",
      clear: "Clear",
      shuffle: "Shuffle",
      quitToMenu: "Quit to menu",
      quitConfirm: "Tap again to quit",
      oneAway: "One away",
      noActiveGame: "No active game.",
      backToMenu: "Back to menu",
      mistakesLabel: "Mistakes",
      mistakesAria: (u, m) => `Mistakes used ${u} of ${m}`,
      selectedAria: (n, m) => `Selected ${n} of ${m}`,
      gridAria: "Puzzle grid. Use arrow keys to move between cards.",
      elapsedAria: (time) => `Elapsed time: ${time}`,
      solvedCardAria: (value, group) => `${value}. Solved group: ${group}`,
      correctGroup: "Correct group",
      incorrectGroup: "Not a group",
    },
    difficulty: {
      easy: "Easy",
      medium: "Medium",
      hard: "Master",
    },
    mode: {
      daily: "Daily",
      standard: "Standard",
      replay: "replay",
    },
    tabs: {
      label: "Foldwink Tabs",
      solvedCount: (n, t) => `${n}/${t} solved`,
      winkReady: "✦ wink ready",
      winkUsed: "✦ wink used",
      winkShort: "✦ wink",
      winkConfirm: "tap to confirm",
      solvedAria: (name) => `Solved category: ${name}`,
      winkedAria: (name) => `Winked category: ${name}`,
      clickAria: "Wink this tab to reveal the full category",
      concealedAria: "Concealed category preview",
      tabsHintAria: "Tabs hint the hidden categories",
    },
    result: {
      noResult: "No result.",
      backToMenu: "Back to menu",
      grade: "Grade",
      newBest: (n) => `✦ New best streak ${n}`,
      closeOne: "Close one",
      missedVariants: [
        "Every good solver misses a puzzle.",
        "Even seasoned players misread a grid now and then.",
        "This one didn't land — happens to the best.",
        "Wrong turn on this one. Nothing a fresh board can't fix.",
      ],
      nextDaily: "A new daily lands tomorrow.",
      tryFresh: "Try a fresh one — the pattern won't catch you twice.",
      winAffirmations: [
        "Clean read of the board.",
        "Nice chain of solves.",
        "Clear thinking paid off.",
        "The categories held together.",
      ],
      nextPuzzle: "Next puzzle",
      tryMedium: "Try a Medium puzzle",
      showStats: "Stats",
      subtitleDaily: (d) => `Daily · ${d}`,
      subtitleStandard: (n) => `Standard · #${String(n).padStart(3, "0")}`,
    },
    resultSummary: {
      solved: "Solved",
      outOfMistakes: "Out of mistakes",
      cleared: "Foldwink · cleared",
      closeCall: "Foldwink · close call",
      time: "Time",
      mistakes: "Mistakes",
      streak: "Streak",
    },
    stats: {
      subtitle: "Your Foldwink record",
      solved: "Solved",
      played: "Played",
      winRate: "Win %",
      wins: "Wins",
      losses: "Losses",
      streak: "Streak",
      best: "Best",
      depth: "Depth",
      flawless: "Flawless",
      avgMiss: "Avg miss",
      medWinRate: "Med W%",
      winks: "Winks",
      dailyHistory: "Daily history",
      emptyRecord: "Empty record",
      emptyRecordDetail: "No puzzles played yet. Start with today's daily from the menu.",
      backToMenu: "Back to menu",
    },
    daily: {
      label: "Daily",
      solved: "solved",
      missed: "missed",
      nextDailyIn: "Next daily in",
      noHistoryYet: "No daily history yet. Solve today's puzzle to start.",
      solvedShort: "Solved",
      failedShort: "Failed",
      foldSolved: "Solved",
      foldCracked: "Restored Seal (Kintsugi)",
      foldRestored: "Restored Seal (Kintsugi)",
      foldMissed: "Missed",
      foldEmpty: "Not played",
      graceWaxApplied: "✨ Restored Seal (Kintsugi): Streak protected with golden repair!",
      todayMarker: "Today",
      momentLabel: "Daily note",
      momentFirst: "First daily on the record.",
      momentFlawless: "First flawless daily win.",
      momentLogged: "Today's daily is logged.",
      momentFastest: (time) => `Fastest daily win at ${time}.`,
      momentFastestCompared: (time, date) => `Previous best ${time} on ${date}.`,
      recentSummary: (solved, recorded) => `${solved}/${recorded} recent dailies solved.`,
    },
    share: {
      shareResult: "Share result",
      preparing: "Preparing…",
      copied: "Copied!",
      savedImage: "Saved image",
      unavailable: "Share unavailable",
      shareTextSolvedLine: (t, m) => `Solved in ${t} · ${m}/4 mistakes`,
      shareTextOutLine: (m) => `Out of mistakes · ${m}/4`,
      shareTextFooter: "neural-void.com/foldwink",
    },
    readiness: {
      almostThere: "Almost there",
      moreEasyWins: (n) => `${n} more easy ${n === 1 ? "win" : "wins"} unlocks Medium`,
      warmingUp: "Warming up",
      mediumUnlocksAt: (c, t) => `Medium unlocks at ${t} easy wins (${c}/${t})`,
      mediumReady: "Medium-ready",
      tabsFeelNatural: "Foldwink Tabs will feel natural",
      recommended: "Recommended",
      goodNextStep: "A Medium puzzle is a good next step",
      mediumUnlocked: "Medium unlocked",
      tryWhenReady: "Try one when ready",
      toughMediums: "Two tough mediums in a row — try a few more Easy puzzles first.",
      masterChallenge: "Master Challenge",
      masterLocked: "Master Challenge — locked",
      hardComingSoon: "Hard puzzles coming soon",
      moreMediumWins: (n) => `${n} more Medium ${n === 1 ? "win" : "wins"} to unlock`,
      youAreReady: "You're ready",
      slowerRevealsNoWink: "Slower reveals, no Wink",
      toughStretch: "Tough stretch — try a Medium to rebuild momentum.",
    },
    settings: {
      soundOn: "Sound on",
      soundOff: "Sound off",
      hapticsOn: "Haptics on",
      hapticsOff: "Haptics off",
    },
    about: {
      link: "About · Privacy",
      title: "About Foldwink",
      close: "close",
      closeAria: "Close about footer",
      bylineBy: "A small daily grouping puzzle by",
      bylineAfter:
        ". 16 cards, 4 hidden groups, 4 mistakes. Medium puzzles reveal their categories one letter at a time — tap once to Wink.",
      privacy: "Privacy",
      privacyBody:
        "No accounts, no tracking, no network. Your stats, streaks, sound preference, and an optional local-only event counter live in your browser's localStorage and never leave your device. Clearing your site data wipes everything.",
      support: "Support",
      supportBody: "Bug reports and feedback:",
      clearEventLog: "Clear local event log",
      eventLogCleared: "Local event log cleared",
      resetAll: "Reset all local data",
      resetArmed: "Tap again to reset all data — this clears stats, streak, progress",
      resetAria: "Reset all local Foldwink data",
    },
    onboarding: {
      howToPlay: "How to play",
      progressAria: "Tutorial progress",
      stepLabel: (current, total) => `Step ${current} of ${total}`,
      selectTitle: "Find four that belong",
      selectBody:
        "Tap all four cards. They share one category; the full puzzle allows 4 mistakes.",
      selectedCount: (selected, total) => `${selected} of ${total} selected`,
      demoCards: ["APPLE", "PEAR", "LIME", "PLUM"],
      demoGroupAria: "Demo group of four fruit cards",
      submitTitle: "Check your group",
      submitBody: "When four cards are selected, press Submit.",
      correctGroup: "Correct — Fruit",
      continueAction: "Continue",
      tabsTitle: "Read the Foldwink Tabs",
      tabsHint: "Four hidden categories",
      tabsBody:
        "Tabs reveal category letters as you solve. Once per puzzle, Wink one tab to reveal its full name.",
      demoTabs: ["F··", "M··", "S··", "T··"],
      demoCategory: "FRUIT",
      wink: "✦ Wink",
      winkAria: "Wink the Fruit tab",
      winkPrompt: "Tap the highlighted tab to try your one Wink.",
      winkResult: "Wink reveals a category, but you still find its four cards.",
      skip: "Skip",
      gotIt: "Got it",
      menuLink: "How to play",
      guildTitle: "Archivist Guild, Loot & Contracts",
      guildBody:
        "Every solve awards an archival dispatch envelope with Ink 💧, Wax 🕯️, XP and rare collectible stamps. Level up your Scribe Passport or wager your wax in high-stakes Sudden Death Iron Contracts ⚔️!",
    },
    embed: {
      fullSizeTitle: "Give the puzzle the whole screen",
      fullSizeBody:
        "This page is squeezing the game into a small frame. Open the same game directly for readable cards and full-size controls.",
      openFullSize: "Open full-size game",
      continueHere: "Continue in the small frame",
    },
    monetization: {
      tipCta: (amount) => `Support Foldwink · €${amount} tip`,
      supporterHeadlineResult: "Become a Supporter ★",
      supporterHeadlineStats: "Support Foldwink",
      supporterHeadlineMenu: "Support Foldwink ★",
      supporterSublineResult: (price) =>
        `One-time ${price} · keeps Foldwink ad-light and growing.`,
      supporterSublineAmbient: (price) => `${price} · cosmetic Supporter ★ on your stats.`,
      unlockFor: (price) => `Unlock for ${price}`,
      badgeLabel: "Supporter",
      badgeTitle: "Thanks for supporting Foldwink",
    },
    duel: {
      bannerTitle: "Shared Seal Duel",
      youWon: "🏆 You Won the Duel!",
      challengerWon: "💀 Challenger Victorious",
      tie: "🤝 Honorable Tie!",
      yourResult: "Your Result",
      challengerResult: "Challenger",
      sendResponse: "Send Response",
      responseSent: "✓ Response Copied!",
      challengeFriend: "Challenge a Friend (Link Duel)",
      challengeCopied: "Duel Link Copied!",
      mistakesWord: (n) => (n === 1 ? "mistake" : "mistakes"),
    },
    passport: {
      diffTitle: "Wax Seal Passport Transfer",
      currentProfile: "Current Profile",
      importedProfile: "Imported Profile",
      replaceConfirm: "Replace Profile",
      undoImport: "Undo Import (Restore Previous)",
      undoSuccess: "Previous Profile Restored!",
      statLevel: "Archivist Level",
      statXp: "Total XP",
      statStreak: "Daily Streak",
      statInk: "Ink Drops",
      statWax: "Wax Seals",
      statStamps: "Stamps Unlocked",
      preservedStreak: "Preserved",
      sealPassport: "Seal Passport (QR)",
      importSeal: "Import Seal",
      downloadPng: "Download Scroll (PNG)",
      copyCode: "Copy Seal Code",
      sealCopied: "Seal Copied!",
      verifiedSeal: "Verified Guild Seal",
      officialTitle: "Official Guild Title",
      waxSealLabel: "Wax Seal",
      scribeNibLabel: "Scribe Nib",
      ironContractCta: "The Iron Contract (High Stakes)",
      tabPassport: "Passport",
      tabStamps: "Stamp Album",
      stampsCount: (c, t) => `${c}/${t} stamps`,
    },
    palimpsest: {
      menuButton: "The Palimpsest",
      title: "The Palimpsest",
      subtitle: "Dual-Layer Archival Parchment",
      obverseBadge: "Obverse Layer (1/2)",
      reverseBadge: "Reverse Layer (2/2)",
      obverseCompleteTitle: "✦ Obverse Deciphered! ✦",
      obverseCompleteDesc:
        "The surface ink is cleared. A deeper, orthogonal script emerges on the reverse.",
      flipButton: "Flip Parchment ↷",
      completedTitle: "Palimpsest Mastered",
      completedDetail: "Both orthogonal layers of the ancient parchment have been deciphered.",
      doubleSealBadge: "Double Archival Wax Seal",
      archivalReward: "Reward: +50 XP · 🕯️ +3 Wax · 💧 +2 Ink · Dual Stamp Unlocked",
      rulesHint:
        "Solve both orthogonal layers of the same 16 words. First by meaning, then by hidden structure.",
      backToMenu: "Return to Archives",
      outOfMistakesTitle: "Parchment Spoiled",
      outOfMistakesDesc: "All 4 mistakes consumed. The ancient ink bled through.",
      retryLayer: "Retry Layer",
      openPassport: "Open Passport",
      recordedInPassport: "Recorded in Archivist Passport",
    },
  },

  de: {
    menu: {
      subtitle: "Finde 4 versteckte Gruppen · 2–5 Minuten",
      playDaily: "Heutiges Rätsel spielen",
      replayDaily: "Tagesrätsel wiederholen",
      easy: "Leichtes Rätsel",
      medium: "Mittelschweres Rätsel",
      mediumLocked: "Mittel — gesperrt",
      masterChallenge: "Meister-Herausforderung",
      masterLocked: "Meister — gesperrt",
      masterSoon: "Meister — bald verfügbar",
      stats: "Statistik",
      poolSize: (n) => `${n} Rätsel`,
      emptyPool: "Kein Rätsel-Pool",
      emptyPoolDetail:
        "Keine Rätsel im Build. Lege JSON-Dateien in puzzles/pool/ ab und baue neu.",
      iphoneTip: "✦ iPhone-Tipp",
      iphoneTipBody:
        "Tippe in Safari auf Teilen und dann „Zum Home-Bildschirm“ für Vollbildspiel ohne Leiste.",
      installApp: "Foldwink installieren",
      languageAria: "Sprache",
    },
    game: {
      submit: "Bestätigen",
      clear: "Auswahl löschen",
      shuffle: "Mischen",
      quitToMenu: "Zum Menü",
      quitConfirm: "Nochmal tippen zum Beenden",
      oneAway: "Eins daneben",
      noActiveGame: "Kein aktives Spiel.",
      backToMenu: "Zurück zum Menü",
      mistakesLabel: "Fehler",
      mistakesAria: (u, m) => `${u} von ${m} Fehlern`,
      selectedAria: (n, m) => `${n} von ${m} ausgewählt`,
      gridAria: "Rätselraster. Mit den Pfeiltasten zwischen Karten wechseln.",
      elapsedAria: (time) => `Vergangene Zeit: ${time}`,
      solvedCardAria: (value, group) => `${value}. Gelöste Gruppe: ${group}`,
      correctGroup: "Richtige Gruppe",
      incorrectGroup: "Keine Gruppe",
    },
    difficulty: {
      easy: "Leicht",
      medium: "Mittel",
      hard: "Meister",
    },
    mode: {
      daily: "Tagesrätsel",
      standard: "Standard",
      replay: "Wiederholung",
    },
    tabs: {
      label: "Foldwink Tabs",
      solvedCount: (n, t) => `${n}/${t} gelöst`,
      winkReady: "✦ Wink bereit",
      winkUsed: "✦ Wink verwendet",
      winkShort: "✦ Wink",
      winkConfirm: "tippen zum Bestätigen",
      solvedAria: (name) => `Gelöste Kategorie: ${name}`,
      winkedAria: (name) => `Verwinkte Kategorie: ${name}`,
      clickAria: "Tab antippen, um die Kategorie zu enthüllen",
      concealedAria: "Verborgene Kategorie",
      tabsHintAria: "Tabs geben Hinweise auf die Kategorien",
    },
    result: {
      noResult: "Kein Ergebnis.",
      backToMenu: "Zurück zum Menü",
      grade: "Bewertung",
      newBest: (n) => `✦ Neue Beststreak: ${n}`,
      closeOne: "Knapp daneben",
      missedVariants: [
        "Jedem guten Spieler entgeht mal ein Rätsel.",
        "Auch erfahrene Spieler lesen das Brett manchmal falsch.",
        "Diesmal hat's nicht gepasst — passt zum besten Spieler.",
        "Falsche Spur. Ein frisches Brett löst das.",
      ],
      nextDaily: "Morgen gibt es ein neues Tagesrätsel.",
      tryFresh: "Versuch ein neues — das Muster erwischt dich kein zweites Mal.",
      winAffirmations: [
        "Klares Lesen der Karten.",
        "Saubere Kette an Lösungen.",
        "Klarer Kopf hat sich gelohnt.",
        "Die Kategorien passten zusammen.",
      ],
      nextPuzzle: "Nächstes Rätsel",
      tryMedium: "Mittel-Rätsel probieren",
      showStats: "Statistik",
      subtitleDaily: (d) => `Tagesrätsel · ${d}`,
      subtitleStandard: (n) => `Standard · #${String(n).padStart(3, "0")}`,
    },
    resultSummary: {
      solved: "Gelöst",
      outOfMistakes: "Keine Versuche mehr",
      cleared: "Foldwink · gelöst",
      closeCall: "Foldwink · knapp daneben",
      time: "Zeit",
      mistakes: "Fehler",
      streak: "Streak",
    },
    stats: {
      subtitle: "Deine Foldwink-Bilanz",
      solved: "Gelöst",
      played: "Gespielt",
      winRate: "Siege %",
      wins: "Siege",
      losses: "Verluste",
      streak: "Streak",
      best: "Beste",
      depth: "Tiefe",
      flawless: "Makellos",
      avgMiss: "Ø Fehler",
      medWinRate: "Mittel S%",
      winks: "Winks",
      dailyHistory: "Tagesrätsel-Verlauf",
      emptyRecord: "Noch leer",
      emptyRecordDetail:
        "Noch keine Rätsel gespielt. Starte mit dem heutigen Tagesrätsel aus dem Menü.",
      backToMenu: "Zurück zum Menü",
    },
    daily: {
      label: "Tagesrätsel",
      solved: "gelöst",
      missed: "verpasst",
      nextDailyIn: "Nächstes Tagesrätsel in",
      noHistoryYet: "Noch kein Verlauf. Löse das heutige Tagesrätsel, um zu starten.",
      solvedShort: "Gelöst",
      failedShort: "Verpasst",
      foldSolved: "Gelöst",
      foldCracked: "Restauriertes Siegel (Kintsugi)",
      foldRestored: "Restauriertes Siegel (Kintsugi)",
      foldMissed: "Verpasst",
      foldEmpty: "Nicht gespielt",
      graceWaxApplied: "✨ Siegel-Schutz: Streak mit goldenem Kintsugi-Siegel restauriert!",
      todayMarker: "Heute",
      momentLabel: "Tagesnotiz",
      momentFirst: "Erster Tageseintrag.",
      momentFlawless: "Erster makelloser Tages­sieg.",
      momentLogged: "Heutiges Tagesrätsel ist vermerkt.",
      momentFastest: (time) => `Schnellster Tages­sieg: ${time}.`,
      momentFastestCompared: (time, date) => `Vorher ${time} am ${date}.`,
      recentSummary: (solved, recorded) => `${solved}/${recorded} letzte Tagesrätsel gelöst.`,
    },
    share: {
      shareResult: "Ergebnis teilen",
      preparing: "Wird vorbereitet…",
      copied: "Kopiert!",
      savedImage: "Bild gespeichert",
      unavailable: "Teilen nicht verfügbar",
      shareTextSolvedLine: (t, m) => `Gelöst in ${t} · ${m}/4 Fehler`,
      shareTextOutLine: (m) => `Keine Versuche mehr · ${m}/4`,
      shareTextFooter: "neural-void.com/foldwink",
    },
    readiness: {
      almostThere: "Fast geschafft",
      moreEasyWins: (n) =>
        `Noch ${n} leichte${n === 1 ? "r Sieg" : " Siege"} bis Mittel freigeschaltet`,
      warmingUp: "Aufwärmen",
      mediumUnlocksAt: (c, t) => `Mittel ab ${t} leichten Siegen (${c}/${t})`,
      mediumReady: "Bereit für Mittel",
      tabsFeelNatural: "Foldwink Tabs werden sich vertraut anfühlen",
      recommended: "Empfohlen",
      goodNextStep: "Ein Mittel-Rätsel wäre der nächste Schritt",
      mediumUnlocked: "Mittel freigeschaltet",
      tryWhenReady: "Probier es, wenn du bereit bist",
      toughMediums: "Zwei zähe Mittel-Rätsel in Folge — spiel zuerst ein paar Leichte.",
      masterChallenge: "Meister-Herausforderung",
      masterLocked: "Meister — gesperrt",
      hardComingSoon: "Meister-Rätsel kommen bald",
      moreMediumWins: (n) =>
        `Noch ${n} Mittel-${n === 1 ? "Sieg" : "Siege"} bis zur Freischaltung`,
      youAreReady: "Du bist bereit",
      slowerRevealsNoWink: "Langsamere Hinweise, kein Wink",
      toughStretch: "Harte Phase — spiel ein Mittel-Rätsel, um Momentum zurückzugewinnen.",
    },
    settings: {
      soundOn: "Ton an",
      soundOff: "Ton aus",
      hapticsOn: "Vibration an",
      hapticsOff: "Vibration aus",
    },
    about: {
      link: "Über · Datenschutz",
      title: "Über Foldwink",
      close: "schließen",
      closeAria: "Über-Bereich schließen",
      bylineBy: "Ein kleines tägliches Gruppen-Rätsel von",
      bylineAfter:
        ". 16 Karten, 4 versteckte Gruppen, 4 Fehler. Mittel-Rätsel enthüllen Kategorien Buchstabe für Buchstabe — einmal antippen für Wink.",
      privacy: "Datenschutz",
      privacyBody:
        "Keine Konten, kein Tracking, keine Netzwerkanfragen. Deine Statistik, Streaks, Toneinstellungen und ein optionaler lokaler Ereigniszähler liegen nur im localStorage deines Browsers und verlassen dein Gerät nicht. Browser-Daten löschen entfernt alles.",
      support: "Support",
      supportBody: "Fehler und Feedback:",
      clearEventLog: "Lokalen Ereigniszähler löschen",
      eventLogCleared: "Ereigniszähler gelöscht",
      resetAll: "Alle lokalen Daten zurücksetzen",
      resetArmed: "Nochmal tippen zum Zurücksetzen — löscht Statistik, Streak, Fortschritt",
      resetAria: "Alle lokalen Foldwink-Daten zurücksetzen",
    },
    onboarding: {
      howToPlay: "So wird gespielt",
      progressAria: "Fortschritt der Einführung",
      stepLabel: (current, total) => `Schritt ${current} von ${total}`,
      selectTitle: "Finde vier passende Karten",
      selectBody:
        "Tippe alle vier Karten an. Sie gehören zu einer Kategorie; im Spiel sind 4 Fehler erlaubt.",
      selectedCount: (selected, total) => `${selected} von ${total} ausgewählt`,
      demoCards: ["APFEL", "BIRNE", "LIMETTE", "PFLAUME"],
      demoGroupAria: "Beispielgruppe mit vier Obstkarten",
      submitTitle: "Prüfe deine Gruppe",
      submitBody: "Sind vier Karten gewählt, tippe auf Bestätigen.",
      correctGroup: "Richtig — Obst",
      continueAction: "Weiter",
      tabsTitle: "Lies die Foldwink Tabs",
      tabsHint: "Vier verborgene Kategorien",
      tabsBody:
        "Beim Lösen enthüllen Tabs Buchstaben der Kategorien. Einmal pro Spiel deckt Wink einen ganzen Namen auf.",
      demoTabs: ["O··", "M··", "S··", "T··"],
      demoCategory: "OBST",
      wink: "✦ Wink",
      winkAria: "Wink für den Tab Obst einsetzen",
      winkPrompt: "Tippe auf den markierten Tab und probiere deinen einen Wink aus.",
      winkResult: "Wink verrät eine Kategorie; ihre vier Karten musst du trotzdem finden.",
      skip: "Überspringen",
      gotIt: "Verstanden",
      menuLink: "Spielregeln",
      guildTitle: "Archivarsgilde, Beute & Kontrakte",
      guildBody:
        "Jeder Sieg bringt einen Umschlag mit Tinte 💧, Siegelwachs 🕯️, XP und seltenen Briefmarken. Steigere deinen Schreiber-Pass und riskiere dein Wachs in eisernen Sudden-Death-Kontrakten ⚔️!",
    },
    embed: {
      fullSizeTitle: "Gib dem Rätsel den ganzen Bildschirm",
      fullSizeBody:
        "Diese Seite drückt das Spiel in einen kleinen Rahmen. Öffne dasselbe Spiel direkt für lesbare Karten und große Bedienelemente.",
      openFullSize: "Spiel in voller Größe öffnen",
      continueHere: "Im kleinen Rahmen weiterspielen",
    },
    monetization: {
      tipCta: (amount) => `Foldwink unterstützen · €${amount} Trinkgeld`,
      supporterHeadlineResult: "Werde Supporter ★",
      supporterHeadlineStats: "Foldwink unterstützen",
      supporterHeadlineMenu: "Foldwink unterstützen ★",
      supporterSublineResult: (price) =>
        `Einmalig ${price} · hält Foldwink werbearm und am Wachsen.`,
      supporterSublineAmbient: (price) =>
        `${price} · kosmetisches Supporter-★ in deiner Statistik.`,
      unlockFor: (price) => `Freischalten für ${price}`,
      badgeLabel: "Supporter",
      badgeTitle: "Danke, dass du Foldwink unterstützt",
    },
    duel: {
      bannerTitle: "Siegel-Duell",
      youWon: "🏆 Duell gewonnen!",
      challengerWon: "💀 Herausforderer siegt",
      tie: "🤝 Ehrenhaftes Unentschieden!",
      yourResult: "Dein Ergebnis",
      challengerResult: "Herausforderer",
      sendResponse: "Antwort senden",
      responseSent: "✓ Antwort kopiert!",
      challengeFriend: "Freund herausfordern (Duell)",
      challengeCopied: "Duell-Link kopiert!",
      mistakesWord: (n) => (n === 1 ? "Fehler" : "Fehler"),
    },
    passport: {
      diffTitle: "Wachssiegel-Pass Transfer",
      currentProfile: "Aktuelles Profil",
      importedProfile: "Importiertes Profil",
      replaceConfirm: "Profil ersetzen",
      undoImport: "Import rückgängig machen",
      undoSuccess: "Vorheriges Profil wiederhergestellt!",
      statLevel: "Archivar-Stufe",
      statXp: "Gesamt-XP",
      statStreak: "Tages-Streak",
      statInk: "Tintentropfen",
      statWax: "Siegelwachs",
      statStamps: "Briefmarken",
      preservedStreak: "Behalten",
      sealPassport: "Pass versiegeln (QR)",
      importSeal: "Siegel importieren",
      downloadPng: "Urkunde speichern (PNG)",
      copyCode: "Siegelcode kopieren",
      sealCopied: "Siegel kopiert!",
      verifiedSeal: "Geprüftes Gildensiegel",
      officialTitle: "Offizieller Gildentitel",
      waxSealLabel: "Wachssiegel",
      scribeNibLabel: "Schreibfeder",
      ironContractCta: "Eiserner Vertrag (Hohe Einsätze)",
      tabPassport: "Pass",
      tabStamps: "Marken-Album",
      stampsCount: (c, t) => `${c}/${t} Marken`,
    },
    palimpsest: {
      menuButton: "Das Palimpsest",
      title: "Das Palimpsest",
      subtitle: "Doppellagiges Pergament",
      obverseBadge: "Vorderseite (1/2)",
      reverseBadge: "Rückseite (2/2)",
      obverseCompleteTitle: "✦ Vorderseite gelöst! ✦",
      obverseCompleteDesc:
        "Die Oberfläche ist entschlüsselt. Auf der Rückseite zeigt sich eine orthogonale Struktur.",
      flipButton: "Pergament wenden ↷",
      completedTitle: "Palimpsest vollendet",
      completedDetail: "Beide orthogonalen Schichten des alten Pergaments wurden entschlüsselt.",
      doubleSealBadge: "Doppeltes Archiv-Siegel",
      archivalReward: "Belohnung: +50 XP · 🕯️ +3 Wachs · 💧 +2 Tinte · Palimpsest-Marke freigeschaltet",
      rulesHint:
        "Löse beide Ebenen derselben 16 Wörter. Erst nach Bedeutung, dann nach verborgener Struktur.",
      backToMenu: "Zurück zum Archiv",
      outOfMistakesTitle: "Pergament beschädigt",
      outOfMistakesDesc: "Alle 4 Fehler aufgebraucht. Die alte Tinte ist verlaufen.",
      retryLayer: "Ebene neu starten",
      openPassport: "Pass öffnen",
      recordedInPassport: "Im Archivars-Pass vermerkt",
    },
  },

  ru: {
    menu: {
      subtitle: "Найди 4 скрытые группы · 2–5 минут",
      playDaily: "Играть сегодняшний пазл",
      replayDaily: "Повторить дневной",
      easy: "Лёгкий пазл",
      medium: "Средний пазл",
      mediumLocked: "Средний — заблокирован",
      masterChallenge: "Мастер-испытание",
      masterLocked: "Мастер — заблокирован",
      masterSoon: "Мастер — скоро",
      stats: "Статистика",
      poolSize: (n) => `${n} пазлов`,
      emptyPool: "Пул пуст",
      emptyPoolDetail:
        "В этой сборке нет пазлов. Добавь JSON-файлы в puzzles/pool/ и пересобери.",
      iphoneTip: "✦ Совет для iPhone",
      iphoneTipBody:
        "Нажми в Safari «Поделиться» и «На экран „Домой“» — будет чистый полноэкранный режим.",
      installApp: "Установить Foldwink",
      languageAria: "Язык",
    },
    game: {
      submit: "Подтвердить",
      clear: "Снять выбор",
      shuffle: "Перемешать",
      quitToMenu: "В меню",
      quitConfirm: "Нажми ещё раз, чтобы выйти",
      oneAway: "Одна мимо",
      noActiveGame: "Нет активной игры.",
      backToMenu: "В меню",
      mistakesLabel: "Ошибки",
      mistakesAria: (u, m) => `Использовано ошибок: ${u} из ${m}`,
      selectedAria: (n, m) => `Выбрано ${n} из ${m}`,
      gridAria: "Сетка головоломки. Стрелки перемещают между карточками.",
      elapsedAria: (time) => `Прошло: ${time}`,
      solvedCardAria: (value, group) => `${value}. Решённая группа: ${group}`,
      correctGroup: "Верная группа",
      incorrectGroup: "Не группа",
    },
    difficulty: {
      easy: "Лёгкий",
      medium: "Средний",
      hard: "Мастер",
    },
    mode: {
      daily: "Дневной",
      standard: "Стандарт",
      replay: "повтор",
    },
    tabs: {
      label: "Foldwink Tabs",
      solvedCount: (n, t) => `${n}/${t} решено`,
      winkReady: "✦ wink готов",
      winkUsed: "✦ wink использован",
      winkShort: "✦ wink",
      winkConfirm: "подтверди",
      solvedAria: (name) => `Решённая категория: ${name}`,
      winkedAria: (name) => `Подмигнутая категория: ${name}`,
      clickAria: "Нажми на вкладку, чтобы раскрыть категорию",
      concealedAria: "Скрытая категория",
      tabsHintAria: "Вкладки подсказывают скрытые категории",
    },
    result: {
      noResult: "Нет результата.",
      backToMenu: "В меню",
      grade: "Оценка",
      newBest: (n) => `✦ Новый рекорд серии: ${n}`,
      closeOne: "Почти!",
      missedVariants: [
        "Даже опытные игроки иногда ошибаются.",
        "Иногда сетка читается не с первого раза.",
        "В этот раз не сложилось — бывает у всех.",
        "Ложный след. Новая сетка всё исправит.",
      ],
      nextDaily: "Новый дневной пазл появится завтра.",
      tryFresh: "Попробуй следующий — закономерность тебя не поймает дважды.",
      winAffirmations: [
        "Чистое чтение сетки.",
        "Хорошая цепочка верных решений.",
        "Ясная голова — ясный результат.",
        "Категории сложились.",
      ],
      nextPuzzle: "Следующий пазл",
      tryMedium: "Попробовать средний",
      showStats: "Статистика",
      subtitleDaily: (d) => `Дневной · ${d}`,
      subtitleStandard: (n) => `Стандарт · #${String(n).padStart(3, "0")}`,
    },
    resultSummary: {
      solved: "Решено",
      outOfMistakes: "Ошибки закончились",
      cleared: "Foldwink · пройдено",
      closeCall: "Foldwink · совсем рядом",
      time: "Время",
      mistakes: "Ошибки",
      streak: "Серия",
    },
    stats: {
      subtitle: "Твой рекорд Foldwink",
      solved: "Решено",
      played: "Сыграно",
      winRate: "% побед",
      wins: "Победы",
      losses: "Поражения",
      streak: "Серия",
      best: "Рекорд",
      depth: "Глубина",
      flawless: "Идеально",
      avgMiss: "Ср. ошибки",
      medWinRate: "% Средние",
      winks: "Winks",
      dailyHistory: "История дневных",
      emptyRecord: "Записей нет",
      emptyRecordDetail: "Пока не сыграно ни одного пазла. Начни с сегодняшнего дневного.",
      backToMenu: "В меню",
    },
    daily: {
      label: "Дневной",
      solved: "решено",
      missed: "пропущено",
      nextDailyIn: "Следующий дневной через",
      noHistoryYet: "История пуста. Реши сегодняшний пазл, чтобы начать.",
      solvedShort: "Решено",
      failedShort: "Провал",
      foldSolved: "Решено",
      foldCracked: "Восстановленная печать (Кинцуги)",
      foldRestored: "Восстановленная печать (Кинцуги)",
      foldMissed: "Не решено",
      foldEmpty: "Не сыграно",
      graceWaxApplied: "✨ Защита Сургуча: серия восстановлена золотой печатью Кинцуги!",
      todayMarker: "Сегодня",
      momentLabel: "Дневная заметка",
      momentFirst: "Первая запись о дневном пазле.",
      momentFlawless: "Первая идеальная победа в дневном.",
      momentLogged: "Сегодняшний дневной записан.",
      momentFastest: (time) => `Самая быстрая победа: ${time}.`,
      momentFastestCompared: (time, date) => `Прошлый рекорд: ${time} от ${date}.`,
      recentSummary: (solved, recorded) => `Решено ${solved} из ${recorded} последних дневных.`,
    },
    share: {
      shareResult: "Поделиться результатом",
      preparing: "Готовлю…",
      copied: "Скопировано!",
      savedImage: "Картинка сохранена",
      unavailable: "Поделиться недоступно",
      shareTextSolvedLine: (t, m) => `Решено за ${t} · ${m}/4 ошибок`,
      shareTextOutLine: (m) => `Ошибки закончились · ${m}/4`,
      shareTextFooter: "neural-void.com/foldwink",
    },
    readiness: {
      almostThere: "Почти",
      moreEasyWins: (n) =>
        `Ещё ${n} ${n === 1 ? "победа" : n < 5 ? "победы" : "побед"} на лёгком → средний`,
      warmingUp: "Разминка",
      mediumUnlocksAt: (c, t) => `Средний откроется после ${t} побед на лёгком (${c}/${t})`,
      mediumReady: "Готов к среднему",
      tabsFeelNatural: "Foldwink Tabs будут интуитивны",
      recommended: "Рекомендуем",
      goodNextStep: "Средний пазл — хороший следующий шаг",
      mediumUnlocked: "Средний открыт",
      tryWhenReady: "Попробуй, когда будешь готов",
      toughMediums: "Два тяжёлых средних подряд — попробуй сначала пару лёгких.",
      masterChallenge: "Мастер-испытание",
      masterLocked: "Мастер — заблокирован",
      hardComingSoon: "Мастер-пазлы скоро",
      moreMediumWins: (n) =>
        `Ещё ${n} ${n === 1 ? "победа" : n < 5 ? "победы" : "побед"} на среднем → разблокировка`,
      youAreReady: "Ты готов",
      slowerRevealsNoWink: "Медленные подсказки, без Wink",
      toughStretch: "Тяжёлая полоса — сыграй средний пазл, чтобы вернуть ритм.",
    },
    settings: {
      soundOn: "Звук вкл.",
      soundOff: "Звук выкл.",
      hapticsOn: "Вибро вкл.",
      hapticsOff: "Вибро выкл.",
    },
    about: {
      link: "О проекте · Приватность",
      title: "О Foldwink",
      close: "закрыть",
      closeAria: "Закрыть блок «О проекте»",
      bylineBy: "Маленькая ежедневная головоломка от",
      bylineAfter:
        ". 16 карточек, 4 скрытые группы, 4 ошибки. В средних пазлах категории раскрываются по букве — нажми один раз для Wink.",
      privacy: "Приватность",
      privacyBody:
        "Нет аккаунтов, трекинга и сети. Статистика, серии, настройки звука и опциональный локальный счётчик событий живут только в localStorage и не покидают устройство. Очистка данных сайта удалит всё.",
      support: "Поддержка",
      supportBody: "Баги и фидбек:",
      clearEventLog: "Очистить локальный лог событий",
      eventLogCleared: "Лог событий очищен",
      resetAll: "Сбросить все локальные данные",
      resetArmed: "Нажми ещё раз, чтобы сбросить всё — статистику, серию, прогресс",
      resetAria: "Сбросить все локальные данные Foldwink",
    },
    onboarding: {
      howToPlay: "Как играть",
      progressAria: "Прогресс обучения",
      stepLabel: (current, total) => `Шаг ${current} из ${total}`,
      selectTitle: "Найди четыре связанных слова",
      selectBody:
        "Нажми на все четыре карточки. У них одна категория; в полной игре можно сделать 4 ошибки.",
      selectedCount: (selected, total) => `Выбрано ${selected} из ${total}`,
      demoCards: ["ЯБЛОКО", "ГРУША", "ЛАЙМ", "СЛИВА"],
      demoGroupAria: "Учебная группа из четырёх карточек с фруктами",
      submitTitle: "Проверь группу",
      submitBody: "Когда выбраны четыре карточки, нажми «Подтвердить».",
      correctGroup: "Верно — Фрукты",
      continueAction: "Дальше",
      tabsTitle: "Используй Foldwink Tabs",
      tabsHint: "Четыре скрытые категории",
      tabsBody:
        "По мере решения вкладки открывают буквы категорий. Один раз за игру Wink раскрывает название целиком.",
      demoTabs: ["Ф··", "М··", "С··", "Т··"],
      demoCategory: "ФРУКТЫ",
      wink: "✦ Wink",
      winkAria: "Применить Wink к вкладке «Фрукты»",
      winkPrompt: "Нажми на выделенную вкладку и попробуй единственный Wink.",
      winkResult: "Wink раскрывает категорию, но четыре её карточки всё равно нужно найти.",
      skip: "Пропустить",
      gotIt: "Понятно",
      menuLink: "Правила игры",
      guildTitle: "Гильдия Архивариусов, Лут и Контракты",
      guildBody:
        "Каждая победа приносит запечатанный конверт с чернилами 💧, сургучом 🕯️, XP и редкими марками. Прокачивайте свой Паспорт Архивариуса и ставьте сургуч на кон в рискованных Железных Контрактах ⚔️!",
    },
    embed: {
      fullSizeTitle: "Отдай головоломке весь экран",
      fullSizeBody:
        "Эта страница сжимает игру в маленькое окно. Открой ту же игру напрямую: карточки и кнопки будут нормального размера.",
      openFullSize: "Открыть игру на весь экран",
      continueHere: "Продолжить в маленьком окне",
    },
    monetization: {
      tipCta: (amount) => `Поддержать Foldwink · чаевые €${amount}`,
      supporterHeadlineResult: "Стань саппортером ★",
      supporterHeadlineStats: "Поддержать Foldwink",
      supporterHeadlineMenu: "Поддержать Foldwink ★",
      supporterSublineResult: (price) =>
        `Разовый взнос ${price} · Foldwink остаётся почти без рекламы и растёт.`,
      supporterSublineAmbient: (price) =>
        `${price} · косметический значок «Supporter ★» в статистике.`,
      unlockFor: (price) => `Открыть за ${price}`,
      badgeLabel: "Supporter",
      badgeTitle: "Спасибо за поддержку Foldwink",
    },
    duel: {
      bannerTitle: "Дуэль Печатей",
      youWon: "🏆 Вы победили в Дуэли!",
      challengerWon: "💀 Соперник оказался сильнее",
      tie: "🤝 Благородная Ничья!",
      yourResult: "Ваш результат",
      challengerResult: "Соперник",
      sendResponse: "Отправить ответ на дуэль",
      responseSent: "✓ Ответ скопирован!",
      challengeFriend: "Бросить вызов другу (Дуэль)",
      challengeCopied: "Ссылка на дуэль скопирована!",
      mistakesWord: (n) => (n === 1 ? "ошибка" : n >= 2 && n <= 4 ? "ошибки" : "ошибок"),
    },
    passport: {
      diffTitle: "Перенос Паспорта Архивариуса",
      currentProfile: "Текущий профиль",
      importedProfile: "Импортируемый профиль",
      replaceConfirm: "Заменить профиль",
      undoImport: "Вернуть предыдущий профиль",
      undoSuccess: "Предыдущий профиль возвращён!",
      statLevel: "Уровень Архивариуса",
      statXp: "Всего опыта (XP)",
      statStreak: "Дневная серия",
      statInk: "Капли чернил",
      statWax: "Сургучные печати",
      statStamps: "Собрано марок",
      preservedStreak: "Сохраняется",
      sealPassport: "Запечатать (QR)",
      importSeal: "Импорт Печати",
      downloadPng: "Сохранить Грамоту (PNG)",
      copyCode: "Скопировать Код Печати",
      sealCopied: "Печать Скопирована!",
      verifiedSeal: "Печать проверена Гильдией",
      officialTitle: "Официальный Титул",
      waxSealLabel: "Личная Печать",
      scribeNibLabel: "Перо Мастера",
      ironContractCta: "Железный Контракт (Высокие Ставки)",
      tabPassport: "Паспорт",
      tabStamps: "Альбом Марок",
      stampsCount: (c, t) => `${c}/${t} марок`,
    },
    palimpsest: {
      menuButton: "Палимпсест",
      title: "Палимпсест",
      subtitle: "Двусторонний пергамент Архива",
      obverseBadge: "Лицевая сторона (1/2)",
      reverseBadge: "Оборотная сторона (2/2)",
      obverseCompleteTitle: "✦ Лицевая сторона разгадана! ✦",
      obverseCompleteDesc:
        "Поверхностный слой расшифрован. На обороте проявился скрытый ортогональный текст.",
      flipButton: "Перевернуть лист ↷",
      completedTitle: "Палимпсест покорен",
      completedDetail: "Оба слоя древнего документа успешно разгаданы.",
      doubleSealBadge: "Двойная Сургучная Печать Архива",
      archivalReward: "Награда: +50 XP · 🕯️ +3 Сургуча · 💧 +2 Чернил · Марка Палимпсеста",
      rulesHint:
        "Разгадайте обе стороны одних и тех же 16 слов: сначала по смыслу, затем по ортогональному правилу.",
      backToMenu: "В архив",
      outOfMistakesTitle: "Пергамент испорчен",
      outOfMistakesDesc: "Превышен лимит в 4 ошибки. Древние чернила расплылись.",
      retryLayer: "Переписать слой",
      openPassport: "Открыть Паспорт",
      recordedInPassport: "Занесено в Паспорт архивариуса",
    },
  },
};

export function getStrings(lang?: string): Strings {
  if (lang === "ru") return strings.ru;
  if (lang === "de") return strings.de;
  return strings.en;
}
