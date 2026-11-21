(function () {
  "use strict";

  var STORE_KEY = "sunline-desk-progress-v1";

  var STAGES = [
    {
      title: "1 · Early story",
      why: "Clear the opening Leonida missions first: Gone Fishing, the chapter 2 pop, and Breakfast Run. The shop spend that dies in the chapter 1 wipe is on the missable stage.",
      ids: ["just-like-paradise", "paradise-lost", "trust"]
    },
    {
      title: "2 · Mid and late story",
      why: "Play the chapter 3 through chapter 5 missions in order. The gold story trophy is the last mission, so it closes this stage and is not the platinum.",
      ids: [
        "ts-ass-drug-money", "break-the-bank", "vice-city-baby",
        "family-matters", "dwnfall", "hi-jacked", "top-of-the-world-ma",
        "snow-storm", "you-gotta-know-when-to-get-off"
      ]
    },
    {
      title: "3 · Activities",
      why: "Ranges, races, fishing, and the other marked jobs open as the map does. Clearing them between missions keeps the long checklist from becoming a second playthrough.",
      ids: [
        "master-of-none", "the-shootist", "top-fun", "earn-cash-not-kudos",
        "baited-my-tackle", "stick-fiddler", "road-to-rehabilitation",
        "the-lone-rider", "supply-and-demand", "spin-on-this", "fair-game",
        "one-last-thing"
      ]
    },
    {
      title: "4 · Collectibles",
      why: "Stunts, tags, and the other map pickups are easier once you can cross the state. The card set with a hard deadline is on the missable stage instead.",
      ids: ["cunning-stunts", "you-wainker", "whip-it-good", "the-goodtime-state", "little-boxes"]
    },
    {
      title: "5 · Missable cleanup",
      why: "Do these while the cited window is still open. Possible means the lock is soft or the notes hedge. Watch means a chapter, a pause, or a wipe can cost the pop.",
      ids: [
        "treat-yo-self", "this-was-no-boat-accident", "lets-go-bowling",
        "strangers-and-freaks", "dont-touch-my-deck", "positive-mental-attitude",
        "hot-together", "retail-therapy", "personal-best"
      ]
    }
  ];

  var MATRIX_COLS = ["Chapter 1", "Chapter 2", "Chapter 3", "Later lock", "Free roam"];

  var MATRIX = [
    { id: "treat-yo-self", cells: ["Spend before the cash wipe", "", "", "", "Any open shop"] },
    { id: "this-was-no-boat-accident", cells: ["Starts at Key Lento", "", "", "Pauses, then returns", ""] },
    { id: "lets-go-bowling", cells: ["", "Optional hit at Kingpin Bowling", "", "", ""] },
    { id: "strangers-and-freaks", cells: ["", "", "Yago's timed race", "", "Other stranger strands"] },
    { id: "dont-touch-my-deck", cells: ["", "", "", "Starlet Motel cards before Checking Out", ""] },
    { id: "positive-mental-attitude", cells: ["", "", "", "", "Both characters after Coffee Break"] },
    { id: "hot-together", cells: ["", "", "", "", "Call your partner after Coffee Break"] },
    { id: "retail-therapy", cells: ["", "", "", "", "After Coffee Break; jewelry helps"] },
    { id: "personal-best", cells: ["", "", "", "", "Train both after Coffee Break"] }
  ];

  var COVER_COLS = [
    ["roster", "Roster"],
    ["grades", "Grades"],
    ["hidden", "Hidden"],
    ["story", "Story"],
    ["miss", "Missables"],
    ["act", "Activities"],
    ["full", "100%"],
    ["path", "Path"]
  ];

  var state = {
    trophies: [],
    sources: [],
    earned: new Set(),
    spoilers: false,
    demo: false,
    selected: "",
    filters: { kind: "all", grade: "all", earned: "all" }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function query() {
    var params = new URLSearchParams(location.search);
    return {
      demo: params.get("demo") === "1",
      tab: (params.get("tab") || "tracker").toLowerCase(),
      trophy: params.get("trophy") || ""
    };
  }

  function formatRead(iso) {
    var parts = String(iso || "").split("-");
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    var month = months[Number(parts[1]) - 1];
    if (!month || !parts[2]) return iso || "undated";
    return Number(parts[2]) + " " + month + " " + parts[0];
  }

  function gradeLetter(grade) {
    if (grade === "platinum") return "P";
    if (grade === "gold") return "G";
    if (grade === "silver") return "S";
    if (grade === "bronze") return "B";
    return "?";
  }

  function findTrophy(id) {
    for (var i = 0; i < state.trophies.length; i++) {
      if (state.trophies[i].id === id) return state.trophies[i];
    }
    return null;
  }

  function findSource(id) {
    for (var i = 0; i < state.sources.length; i++) {
      if (state.sources[i].id === id) return state.sources[i];
    }
    return null;
  }

  function hiddenStory(trophy) {
    return state.spoilers && trophy.kind === "story" && !state.earned.has(trophy.id);
  }

  function passes(trophy) {
    var filters = state.filters;
    if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
    var earned = state.earned.has(trophy.id);
    if (filters.earned === "earned" && !earned) return false;
    if (filters.earned === "unearned" && earned) return false;
    if (filters.kind === "story") return trophy.kind === "story";
    if (filters.kind === "collectible") return trophy.kind === "collectible";
    if (filters.kind === "activity") return trophy.kind === "activity";
    if (filters.kind === "missable") {
      return trophy.kind === "missable" || trophy.missable !== "none";
    }
    if (filters.kind === "online") return false;
    return true;
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && Array.isArray(data.earned)) state.earned = new Set(data.earned);
      if (data && typeof data.spoilers === "boolean") state.spoilers = data.spoilers;
    } catch (err) {
      state.earned = new Set();
    }
  }

  function saveStore() {
    if (state.demo) return;
    var earned = [];
    state.trophies.forEach(function (trophy) {
      if (state.earned.has(trophy.id)) earned.push(trophy.id);
    });
    localStorage.setItem(STORE_KEY, JSON.stringify({
      version: 1,
      earned: earned,
      spoilers: state.spoilers
    }));
  }

  function citeTotals() {
    var total = 0;
    var cited = 0;
    state.trophies.forEach(function (trophy) {
      var steps = (trophy.guide && trophy.guide.steps) || [];
      steps.forEach(function (step) {
        total += 1;
        if (Array.isArray(step.cites) && step.cites.length) cited += 1;
      });
    });
    return { total: total, cited: cited };
  }

  function gradeCounts() {
    var counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    state.trophies.forEach(function (trophy) {
      if (counts[trophy.grade] != null) counts[trophy.grade] += 1;
    });
    return counts;
  }

  function renderAudit() {
    var counts = gradeCounts();
    var cites = citeTotals();
    var dates = [];
    state.sources.forEach(function (source) {
      if (dates.indexOf(source.read) === -1) dates.push(source.read);
    });
    $("audit-count").textContent = state.trophies.length + "/55 official trophies present";
    $("audit-grades").textContent = counts.platinum + " platinum, " + counts.gold +
      " gold, " + counts.silver + " silver, " + counts.bronze + " bronze (" +
      counts.platinum + "P " + counts.gold + "G " + counts.silver + "S " +
      counts.bronze + "B)";
    $("audit-cites").textContent = cites.cited + "/" + cites.total + " steps cited";
    $("audit-sources").textContent = state.sources.length + " sources read · " +
      dates.map(formatRead).join(", ");
  }

  function renderTracker() {
    var list = $("trophy-list");
    var shown = 0;
    list.textContent = "";
    state.trophies.forEach(function (trophy) {
      if (!passes(trophy)) return;
      shown += 1;
      var item = document.createElement("li");
      item.className = "item";
      var label = document.createElement("label");
      label.className = "earn";
      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = state.earned.has(trophy.id);
      box.setAttribute("aria-label", hiddenStory(trophy) ? "Earned: hidden story trophy" : "Earned: " + trophy.name);
      box.addEventListener("change", function () {
        if (box.checked) state.earned.add(trophy.id);
        else state.earned.delete(trophy.id);
        saveStore();
        renderTracker();
      });
      label.appendChild(box);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "row";
      button.setAttribute("aria-current", trophy.id === state.selected ? "true" : "false");
      var grade = document.createElement("span");
      grade.className = "grade " + trophy.grade;
      grade.textContent = gradeLetter(trophy.grade);
      var name = document.createElement("span");
      name.className = "name";
      var blurb = document.createElement("span");
      blurb.className = "desc";
      if (hiddenStory(trophy)) {
        name.textContent = "Story trophy (hidden)";
        blurb.textContent = "Name and description stay hidden until you earn it.";
      } else {
        name.textContent = trophy.name;
        if (trophy.missable && trophy.missable !== "none") {
          var flag = document.createElement("span");
          flag.className = "flag";
          flag.textContent = trophy.missable;
          name.appendChild(flag);
        }
        blurb.textContent = trophy.description;
      }
      button.appendChild(grade);
      button.appendChild(name);
      button.appendChild(blurb);
      button.addEventListener("click", function () {
        state.selected = trophy.id;
        renderTracker();
      });
      item.appendChild(label);
      item.appendChild(button);
      list.appendChild(item);
    });
    if (!shown) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = state.filters.kind === "online"
        ? "The official PS5 list has no online trophies."
        : "Nothing matches these filters.";
      list.appendChild(empty);
    }
    var earnedCount = 0;
    state.trophies.forEach(function (trophy) {
      if (state.earned.has(trophy.id)) earnedCount += 1;
    });
    $("progress-label").textContent = earnedCount + " of " + state.trophies.length + " earned";
    renderGuide();
    var current = list.querySelector('[aria-current="true"]');
    if (current) current.scrollIntoView({ block: "nearest" });
  }

  function renderGuide() {
    var guide = $("guide");
    var trophy = findTrophy(state.selected);
    guide.textContent = "";
    if (!trophy) {
      guide.textContent = "Select a trophy to read the walkthrough.";
      return;
    }
    if (hiddenStory(trophy)) {
      var locked = document.createElement("h2");
      locked.textContent = "Story trophy (hidden)";
      var note = document.createElement("p");
      note.className = "official";
      note.textContent = "Earn it, or turn off Hide story spoilers, to read the official name, the official description, and the cited steps.";
      guide.appendChild(locked);
      guide.appendChild(note);
      return;
    }
    var title = document.createElement("h2");
    title.textContent = trophy.name;
    var official = document.createElement("p");
    official.className = "official";
    official.textContent = trophy.description;
    var where = document.createElement("p");
    where.className = "why";
    where.textContent = trophy.chapter;
    var steps = document.createElement("ol");
    ((trophy.guide && trophy.guide.steps) || []).forEach(function (step) {
      var item = document.createElement("li");
      var text = document.createElement("p");
      text.className = "step";
      text.textContent = step.text;
      item.appendChild(text);
      (step.cites || []).forEach(function (cite) {
        var source = findSource(cite);
        var chip = document.createElement("span");
        chip.className = "cite";
        chip.textContent = source ? source.site : cite;
        chip.title = source ? source.title : cite;
        item.appendChild(chip);
      });
      steps.appendChild(item);
    });
    guide.appendChild(title);
    guide.appendChild(official);
    guide.appendChild(where);
    guide.appendChild(steps);
  }

  function stagesWithMop() {
    var used = {};
    STAGES.forEach(function (stage) {
      stage.ids.forEach(function (id) { used[id] = true; });
    });
    var rest = [];
    var platinum = [];
    state.trophies.forEach(function (trophy) {
      if (used[trophy.id]) return;
      if (trophy.grade === "platinum") platinum.push(trophy.id);
      else rest.push(trophy.id);
    });
    return STAGES.concat([{
      title: "6 · Final mop-up",
      why: "Finish the remaining free-roam pops and the long 100% checklist. The platinum comes last, only after the other 54.",
      ids: rest.concat(platinum)
    }]);
  }

  function renderRoadmap() {
    var stages = stagesWithMop();
    var seen = {};
    var problems = 0;
    var placed = 0;
    stages.forEach(function (stage) {
      stage.ids.forEach(function (id) {
        placed += 1;
        if (seen[id] || !findTrophy(id)) problems += 1;
        seen[id] = true;
      });
    });
    $("roadmap-note").textContent = problems
      ? "Stage list needs a fix (" + problems + " unmatched)."
      : "Six stages. " + placed + " trophies, each listed once.";
    var root = $("roadmap");
    root.textContent = "";
    stages.forEach(function (stage) {
      var card = document.createElement("li");
      card.className = "card";
      var title = document.createElement("h3");
      title.textContent = stage.title;
      var why = document.createElement("p");
      why.className = "why";
      why.textContent = stage.why;
      var chips = document.createElement("ul");
      chips.className = "chips";
      stage.ids.forEach(function (id) {
        var trophy = findTrophy(id);
        var chip = document.createElement("li");
        chip.textContent = trophy ? trophy.name : id;
        chips.appendChild(chip);
      });
      card.appendChild(title);
      card.appendChild(why);
      card.appendChild(chips);
      root.appendChild(card);
    });
  }

  function renderMissables() {
    var wrap = $("matrix");
    var table = document.createElement("table");
    table.className = "matrix";
    var head = document.createElement("tr");
    ["Trophy", "Flag"].concat(MATRIX_COLS).forEach(function (label) {
      var cell = document.createElement("th");
      cell.textContent = label;
      head.appendChild(cell);
    });
    table.appendChild(head);
    MATRIX.forEach(function (row) {
      var trophy = findTrophy(row.id);
      var tr = document.createElement("tr");
      var name = document.createElement("td");
      name.className = "name-cell";
      name.textContent = trophy ? trophy.name : row.id;
      var flag = document.createElement("td");
      flag.textContent = trophy ? trophy.missable : "";
      tr.appendChild(name);
      tr.appendChild(flag);
      row.cells.forEach(function (value) {
        var cell = document.createElement("td");
        cell.textContent = value || "—";
        tr.appendChild(cell);
      });
      table.appendChild(tr);
    });
    wrap.textContent = "";
    wrap.appendChild(table);
  }

  function coverFlags(text) {
    var note = String(text || "").toLowerCase();
    return {
      roster: /55|names|list order|official description/.test(note),
      grades: /grade/.test(note),
      hidden: /hidden|secret/.test(note),
      story: /story|chapter|partner/.test(note),
      miss: /miss|warning|deadline|yago|meditation/.test(note),
      act: /activit|robbery/.test(note),
      full: /100%|completion|long road/.test(note),
      path: /platinum path|roadmap|three-stage/.test(note)
    };
  }

  function renderSources() {
    var dates = [];
    state.sources.forEach(function (source) {
      if (dates.indexOf(source.read) === -1) dates.push(source.read);
    });
    $("sources-note").textContent = state.sources.length +
      " public pages read " + dates.map(formatRead).join(", ") +
      ". A mark means that page's notes cover the column.";
    var list = $("source-list");
    list.textContent = "";
    state.sources.forEach(function (source) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = source.url;
      link.textContent = source.title;
      var meta = document.createElement("span");
      meta.className = "support";
      meta.textContent = source.site + " · read " + formatRead(source.read) + " · " + source.supports;
      item.appendChild(link);
      item.appendChild(meta);
      list.appendChild(item);
    });
    var table = document.createElement("table");
    table.className = "cover";
    var head = document.createElement("tr");
    var corner = document.createElement("th");
    corner.textContent = "Source";
    head.appendChild(corner);
    COVER_COLS.forEach(function (col) {
      var cell = document.createElement("th");
      cell.textContent = col[1];
      head.appendChild(cell);
    });
    table.appendChild(head);
    var siteCount = {};
    state.sources.forEach(function (source) {
      siteCount[source.site] = (siteCount[source.site] || 0) + 1;
    });
    state.sources.forEach(function (source) {
      var flags = coverFlags(source.supports);
      var tr = document.createElement("tr");
      var name = document.createElement("td");
      var label = source.site;
      if (siteCount[source.site] > 1 && flags.full) label += " 100%";
      else if (siteCount[source.site] > 1 && flags.path) label += " roadmap";
      name.textContent = label;
      tr.appendChild(name);
      COVER_COLS.forEach(function (col) {
        var cell = document.createElement("td");
        var on = flags[col[0]];
        cell.className = on ? "mark-yes" : "mark-no";
        cell.textContent = on ? "Yes" : "·";
        tr.appendChild(cell);
      });
      table.appendChild(tr);
    });
    var wrap = $("coverage");
    wrap.textContent = "";
    wrap.appendChild(table);
  }

  function showTab(name) {
    var tabs = ["tracker", "roadmap", "missables", "sources"];
    if (tabs.indexOf(name) === -1) name = "tracker";
    tabs.forEach(function (tab) {
      var on = tab === name;
      $("panel-" + tab).hidden = !on;
      $("tab-" + tab).setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function exportProgress() {
    var earned = [];
    state.trophies.forEach(function (trophy) {
      if (state.earned.has(trophy.id)) earned.push(trophy.id);
    });
    var blob = new Blob([JSON.stringify({
      version: 1,
      earned: earned,
      spoilers: state.spoilers
    }, null, 2)], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sunline-progress.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        if (!data || !Array.isArray(data.earned)) throw new Error("shape");
        var known = {};
        state.trophies.forEach(function (trophy) { known[trophy.id] = true; });
        state.earned = new Set(data.earned.filter(function (id) { return known[id]; }));
        if (typeof data.spoilers === "boolean") {
          state.spoilers = data.spoilers;
          $("spoiler").checked = data.spoilers;
        }
        saveStore();
        renderTracker();
      } catch (err) {
        $("progress-label").textContent = "Import needs versioned JSON with an earned list.";
      }
    };
    reader.readAsText(file);
  }

  function bind() {
    document.querySelectorAll(".tab").forEach(function (button) {
      button.addEventListener("click", function () {
        showTab(button.getAttribute("data-tab"));
      });
    });
    $("filter-kind").addEventListener("change", function (event) {
      state.filters.kind = event.target.value;
      renderTracker();
    });
    $("filter-grade").addEventListener("change", function (event) {
      state.filters.grade = event.target.value;
      renderTracker();
    });
    $("filter-earned").addEventListener("change", function (event) {
      state.filters.earned = event.target.value;
      renderTracker();
    });
    $("spoiler").addEventListener("change", function (event) {
      state.spoilers = event.target.checked;
      saveStore();
      renderTracker();
    });
    $("export-btn").addEventListener("click", exportProgress);
    $("import-file").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (file) importProgress(file);
      event.target.value = "";
    });
  }

  function boot() {
    Promise.all([
      fetch("data/trophies.json").then(function (res) { return res.json(); }),
      fetch("data/sources.json").then(function (res) { return res.json(); })
    ]).then(function (payload) {
      state.trophies = payload[0];
      state.sources = payload[1];
      var params = query();
      state.demo = params.demo;
      if (!params.demo) loadStore();
      $("spoiler").checked = state.spoilers;
      var requested = params.trophy && findTrophy(params.trophy);
      if (requested) state.selected = params.trophy;
      else if (params.demo && findTrophy("strangers-and-freaks")) {
        state.selected = "strangers-and-freaks";
      } else if (state.trophies[0]) state.selected = state.trophies[0].id;
      bind();
      renderAudit();
      renderTracker();
      renderRoadmap();
      renderMissables();
      renderSources();
      showTab(params.tab);
      var current = $("trophy-list").querySelector('[aria-current="true"]');
      if (current && params.demo) current.scrollIntoView({ block: "center" });
    }).catch(function () {
      $("audit-count").textContent = "Could not read app/data JSON";
    });
  }

  boot();
})();
