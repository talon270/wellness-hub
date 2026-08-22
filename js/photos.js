/* ============================================================================
   WELLNESS HUB · PHOTO LOG (shared UI)
   ----------------------------------------------------------------------------
   Two places in this app ask you to watch something change over weeks — a mole
   under the ABCDE rules, and a niggle you're rehabbing. Both were checkboxes,
   which is the one thing that can't answer "is it different from last month?".

   This is the shared component: capture, group by subject, and compare the
   oldest against the newest side by side.

   The bytes live in IndexedDB (see storage.js); only metadata is in the main
   state object, and nothing is ever uploaded — there is nowhere to upload to.

   Public: Hub.photoUI
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  function photosOf(kind) {
    return (Hub.state.logs.photos || [])
      .filter(function (p) { return p.kind === kind; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }

  /* Grouped by subject, each newest-first. An unnamed subject is its own
     group rather than being merged into everything else. */
  function bySubject(kind) {
    var groups = {};
    photosOf(kind).forEach(function (p) {
      var key = (p.subject || "").trim() || "(unnamed)";
      (groups[key] = groups[key] || []).push(p);
    });
    return Object.keys(groups).sort().map(function (k) {
      return { subject: k, photos: groups[k] };
    });
  }

  /* ======================================================================
     CARD
     ====================================================================== */
  function card(opts) {
    var groups = bySubject(opts.kind);
    var total = photosOf(opts.kind).length;

    return '<div class="wh-card wh-mb4" data-photocard="' + opts.kind + '">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon(opts.icon || "camera") + opts.title + "</div>" +
        '<span class="wh-chip">' + total + " " + Hub.plural(total, "photo") + "</span>" +
      "</div>" +

      (opts.intro ? '<p class="wh-sm wh-muted wh-mb4">' + opts.intro + "</p>" : "") +

      '<div class="wh-row wh-mb4">' +
        '<button type="button" class="wh-btn wh-btn--primary wh-btn--sm" data-photoadd="' + opts.kind + '">' +
          Hub.icon("camera") + "Add a photo</button>" +
        /* `capture` is a hint, not a demand: on a phone it opens the camera,
           on a desktop it's ignored and you get the file picker. */
        '<input type="file" accept="image/*" capture="environment" hidden ' +
          'data-photofile="' + opts.kind + '" />' +
        '<span class="wh-help">' + (opts.help || "") + "</span>" +
      "</div>" +

      (groups.length
        ? '<div class="wh-stack">' + groups.map(function (g) {
            var newest = g.photos[0];
            var oldest = g.photos[g.photos.length - 1];
            var span = g.photos.length > 1 ? Hub.daysBetween(oldest.date, newest.date) : 0;
            return '<div class="wh-photogroup">' +
              '<div class="wh-row wh-row--between wh-mb4">' +
                "<div><div class=\"wh-setrow__name\">" + Hub.esc(g.subject) + "</div>" +
                  '<div class="wh-setrow__desc mono">' + g.photos.length + " " +
                    Hub.plural(g.photos.length, "photo") +
                    (span > 0 ? " over " + span + " days" : "") + "</div></div>" +
                (g.photos.length > 1
                  ? '<button type="button" class="wh-btn wh-btn--sm" data-photocompare="' +
                    Hub.esc(g.subject) + '" data-kind="' + opts.kind + '">Compare</button>'
                  : "") +
              "</div>" +
              '<div class="wh-photostrip">' + g.photos.slice(0, 12).map(function (p) {
                return '<button type="button" class="wh-photothumb" data-photoopen="' + p.id + '" ' +
                  'title="' + Hub.prettyDate(p.date) + (p.note ? " — " + Hub.esc(p.note) : "") + '">' +
                  '<img data-photosrc="' + p.id + '" alt="' + Hub.esc(g.subject) + ", " +
                    Hub.prettyDate(p.date) + '" loading="lazy" />' +
                  '<span class="wh-photothumb__date mono">' + Hub.esc(shortDate(p.date)) + "</span>" +
                "</button>";
              }).join("") + "</div>" +
            "</div>";
          }).join("") + "</div>"
        : '<div class="wh-empty">' + Hub.icon("camera") + "<strong>No photos yet</strong>" +
          "The first one is only useful once there's a second — start now and the comparison " +
          "exists in a month.</div>") +

      (opts.disclaimer
        ? '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") + "<span>" + opts.disclaimer + "</span></div>"
        : "") +
    "</div>";
  }

  function shortDate(key) {
    var d = Hub.parseYmd(key);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  /* ======================================================================
     WIRING
     ====================================================================== */
  function wire(root, kind) {
    /* Thumbnails are painted after render — the bytes come from IndexedDB and
       there's no synchronous way to have them in the markup. */
    paintThumbs(root);

    Hub.delegate(root, "[data-photoadd]", function (b) {
      var input = root.querySelector('[data-photofile="' + b.dataset.photoadd + '"]');
      if (input) input.click();
    });

    root.querySelectorAll("[data-photofile]").forEach(function (input) {
      /* Re-bound on every render, so guard against stacking listeners. */
      if (input.__whBound) return;
      input.__whBound = true;
      input.addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0];
        e.target.value = "";
        if (!file) return;
        askDetails(input.dataset.photofile, file);
      });
    });

    Hub.delegate(root, "[data-photoopen]", function (b) { openPhoto(b.dataset.photoopen); });

    Hub.delegate(root, "[data-photocompare]", function (b) {
      compare(b.dataset.kind, b.dataset.photocompare);
    });
  }

  function paintThumbs(root) {
    root.querySelectorAll("img[data-photosrc]").forEach(function (img) {
      if (img.getAttribute("src")) return;
      Hub.storage.getPhoto(img.dataset.photosrc).then(function (data) {
        if (data && img.isConnected) img.src = data;
      });
    });
  }

  /* Subject first, then store — a photo with no subject can't be compared
     with anything, which is the entire point of keeping it. */
  function askDetails(kind, file) {
    var existing = {};
    photosOf(kind).forEach(function (p) {
      if (p.subject) existing[p.subject] = true;
    });
    var known = Object.keys(existing).sort();

    Hub.modal({
      title: "Label this photo",
      body:
        '<label class="wh-field"><span class="wh-field__label">' +
          (kind === "skin" ? "Which mole or area?" : "Which niggle or area?") + "</span>" +
          '<input class="wh-input" id="ph-subject" type="text" maxlength="48" list="ph-known" ' +
          'placeholder="' + (kind === "skin" ? "e.g. left shoulder blade" : "e.g. right wrist") + '" /></label>' +
        (known.length
          ? '<datalist id="ph-known">' + known.map(function (k) {
              return '<option value="' + Hub.esc(k) + '"></option>';
            }).join("") + "</datalist>" +
            '<p class="wh-help wh-mt4">Reuse an existing name to add to that series: ' +
              known.slice(0, 4).map(function (k) { return "<b>" + Hub.esc(k) + "</b>"; }).join(", ") +
              (known.length > 4 ? " and " + (known.length - 4) + " more" : "") + "</p>"
          : "") +
        '<div class="wh-grid wh-grid--2 wh-mt4" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">Date taken</span>' +
            '<input class="wh-input" id="ph-date" type="date" value="' + Hub.viewDate() +
              '" max="' + Hub.today() + '" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">Note</span>' +
            '<input class="wh-input" id="ph-note" type="text" maxlength="80" placeholder="optional" /></label>' +
        "</div>" +
        '<p class="wh-help wh-mt4">The image is resized to about 1000px and stored on this device only.</p>',
      actions: [
        { label: "Cancel", variant: "ghost" },
        { label: "Save photo", variant: "primary", close: false, onClick: function () {
          var subject = document.getElementById("ph-subject").value.trim();
          if (!subject) { Hub.toast("Give it a name so it can be compared later.", "warn"); return; }
          var date = document.getElementById("ph-date").value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = Hub.viewDate();
          var note = document.getElementById("ph-note").value.trim();

          Hub.closeModal();
          Hub.toast("Saving photo…", "info", 2000);
          Hub.storage.addPhoto(file, { kind: kind, subject: subject, note: note, date: date })
            .then(function (rec) {
              if (rec) Hub.toast("Photo saved.", "success");
            });
        } }
      ]
    });
  }

  function openPhoto(id) {
    var rec = (Hub.state.logs.photos || []).filter(function (p) { return p.id === id; })[0];
    if (!rec) return;

    Hub.storage.getPhoto(id).then(function (data) {
      Hub.modal({
        title: rec.subject || "Photo",
        body:
          (data
            ? '<img class="wh-photofull" src="' + data + '" alt="' + Hub.esc(rec.subject) + '" />'
            : '<p class="wh-sm wh-faint">The image data for this photo is missing — it may have been ' +
              "cleared from this browser's storage.</p>") +
          '<div class="wh-row wh-row--between wh-mt4">' +
            '<span class="wh-sm">' + Hub.prettyDate(rec.date) + "</span>" +
            '<span class="wh-help mono">' + Hub.esc(Hub.relDay(rec.date)) +
              (rec.bytes ? " · " + Math.round(rec.bytes / 1024) + " KB" : "") + "</span>" +
          "</div>" +
          (rec.note ? '<p class="wh-sm wh-mt4">' + Hub.esc(rec.note) + "</p>" : ""),
        actions: [
          { label: "Delete", variant: "danger", close: false, onClick: function () {
            Hub.confirm({
              title: "Delete this photo?",
              body: "It'll be removed from this device. This can't be undone.",
              confirmLabel: "Delete",
              onConfirm: function () {
                Hub.storage.deletePhoto(id).then(function () {
                  Hub.toast("Photo deleted.", "info", 2000);
                });
              }
            });
          } },
          { label: "Close", variant: "ghost" }
        ]
      });
    });
  }

  /* Oldest against newest, which is the comparison that actually answers
     "has this changed?" — a strip of thumbnails never does. */
  function compare(kind, subject) {
    var list = photosOf(kind).filter(function (p) {
      return ((p.subject || "").trim() || "(unnamed)") === subject;
    });
    if (list.length < 2) return;

    var newest = list[0], oldest = list[list.length - 1];
    var gap = Hub.daysBetween(oldest.date, newest.date);

    Promise.all([Hub.storage.getPhoto(oldest.id), Hub.storage.getPhoto(newest.id)])
      .then(function (data) {
        Hub.modal({
          title: subject,
          body:
            '<p class="wh-sm wh-muted wh-mb4">' + gap + " days apart" +
              (list.length > 2 ? " · " + (list.length - 2) + " more in between" : "") + ".</p>" +
            '<div class="wh-photocompare">' +
              ["Oldest", "Newest"].map(function (label, i) {
                var rec = i ? newest : oldest;
                return "<div>" +
                  '<div class="wh-xs wh-faint wh-mb4">' + label + " · " + Hub.prettyDate(rec.date) + "</div>" +
                  (data[i]
                    ? '<img class="wh-photofull" src="' + data[i] + '" alt="' + Hub.esc(subject) + ", " + label + '" />'
                    : '<p class="wh-sm wh-faint">Image missing.</p>') +
                  (rec.note ? '<p class="wh-xs wh-faint wh-mt4">' + Hub.esc(rec.note) + "</p>" : "") +
                "</div>";
              }).join("") +
            "</div>" +
            '<p class="wh-help wh-mt4">Lighting, angle and camera all change how something looks. ' +
              "A difference you can only see between two photos taken in different rooms is usually the " +
              "rooms. A difference that's obvious is worth showing a doctor.</p>",
          actions: [{ label: "Close", variant: "ghost" }]
        });
      });
  }

  Hub.photoUI = {
    card: card,
    wire: wire,
    paintThumbs: paintThumbs,
    bySubject: bySubject,
    photosOf: photosOf,
    openPhoto: openPhoto
  };
})();
