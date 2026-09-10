/* ============================================================================
   WELLNESS HUB · CALENDAR EXPORT
   ----------------------------------------------------------------------------
   The honest workaround for the one thing a web app genuinely cannot do:
   notify you when it isn't running.

   This writes your enabled clock-based reminders, and any upcoming check-ups,
   into a standard .ics file. Import it once into whatever calendar your OS
   already nags you through (GNOME Calendar, Thunderbird, Google, Outlook,
   Apple Calendar) and those reminders fire whether or not this app is open.

   Interval reminders (eye breaks every 20 minutes, sunscreen every 2 hours)
   are deliberately NOT exported — a calendar entry every 20 minutes would be
   unusable, and those are the ones you genuinely want tied to actually sitting
   at a screen.

   Public: Hub.calendar
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* RFC 5545 wants CRLF line endings and lines folded at 75 octets. */
  function fold(line) {
    if (line.length <= 74) return line;
    var out = line.slice(0, 74);
    var rest = line.slice(74);
    while (rest.length) {
      out += "\r\n " + rest.slice(0, 73);
      rest = rest.slice(73);
    }
    return out;
  }

  /* Commas, semicolons, backslashes and newlines are structural in .ics. */
  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  /* Local floating time — no timezone suffix — so a reminder set for 08:00
     stays at 08:00 wherever you happen to be. */
  function localStamp(date, hhmm) {
    var p = String(hhmm || "00:00").split(":");
    return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) +
           "T" + pad(Number(p[0])) + pad(Number(p[1])) + "00";
  }

  function utcStamp(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
           "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }

  /* Stable per reminder, deliberately: a calendar treats a repeated UID as the
     same event, so re-exporting after changing a time updates the existing
     entry instead of leaving you with two. */
  function uid(key) {
    return "wellness-" + key + "@wellness-hub.local";
  }

  /* ======================================================================
     BUILD
     ====================================================================== */
  function build(opts) {
    opts = opts || {};
    var now = new Date();
    var stamp = utcStamp(now);
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Wellness Hub//Reminders//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Wellness Hub",
      "X-WR-CALDESC:Daily health reminders exported from Wellness Hub"
    ];
    var count = 0;

    /* ---------- daily clock reminders ---------- */
    if (opts.reminders !== false) {
      var meta = Hub.reminders.meta;
      Object.keys(meta).forEach(function (key) {
        var m = meta[key];
        var cfg = Hub.state.settings.reminders[key];
        if (m.kind !== "clock") return;                 // interval ones don't belong here
        if (!cfg || !cfg.enabled) return;

        count++;
        lines.push(
          "BEGIN:VEVENT",
          "UID:" + uid(key),
          "DTSTAMP:" + stamp,
          "DTSTART:" + localStamp(now, cfg.time),
          "DURATION:PT10M",
          "RRULE:FREQ=DAILY",
          fold("SUMMARY:" + esc(m.title)),
          fold("DESCRIPTION:" + esc(m.body + "\n\nFrom Wellness Hub.")),
          "CATEGORIES:HEALTH",
          "TRANSP:TRANSPARENT",
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          fold("DESCRIPTION:" + esc(m.title)),
          "TRIGGER:PT0M",
          "END:VALARM",
          "END:VEVENT"
        );
      });
    }

    /* ---------- upcoming check-ups ---------- */
    if (opts.checkups !== false) {
      (Hub.state.logs.checkups || []).forEach(function (c) {
        var st = Hub.gamify.checkupStatus(c);
        /* Nothing useful to schedule for one that's never been logged. */
        if (!st.dueISO) return;

        var due = Hub.parseYmd(st.dueISO);
        /* Something already overdue should land tomorrow, not in the past. */
        if (st.state === "overdue") {
          due = new Date();
          due.setDate(due.getDate() + 1);
        }
        count++;
        lines.push(
          "BEGIN:VEVENT",
          "UID:" + uid("checkup-" + c.id),
          "DTSTAMP:" + stamp,
          "DTSTART;VALUE=DATE:" + due.getFullYear() + pad(due.getMonth() + 1) + pad(due.getDate()),
          fold("SUMMARY:" + esc("Book: " + c.name)),
          fold("DESCRIPTION:" + esc(
            (c.note || "") +
            (c.lastISO ? "\n\nLast done: " + Hub.prettyDate(c.lastISO) : "") +
            "\nInterval: every " + st.months + " months" +
            "\n\nFrom Wellness Hub.")),
          "CATEGORIES:HEALTH",
          "TRANSP:TRANSPARENT",
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          fold("DESCRIPTION:" + esc("Due: " + c.name)),
          "TRIGGER:-P1D",                                // a day's warning
          "END:VALARM",
          "END:VEVENT"
        );
      });
    }

    lines.push("END:VCALENDAR");
    return { ics: lines.join("\r\n") + "\r\n", count: count };
  }

  /* ======================================================================
     DOWNLOAD
     ====================================================================== */
  function download(opts) {
    var built = build(opts);
    if (!built.count) {
      Hub.toast("Nothing to export — switch on some daily reminders first.", "warn", 5000);
      return;
    }
    var blob = new Blob([built.ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "wellness-hub-reminders.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    Hub.toast("Exported " + built.count + " calendar " + Hub.plural(built.count, "reminder") + ".", "success", 4000);
  }

  Hub.calendar = { build: build, download: download };
})();
