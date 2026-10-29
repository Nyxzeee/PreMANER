/* ==========================================================================
   LYNUXS — maskot karakter + sistem animasi.

   Dipindahkan dari proyek lama (yusmentoro67.js). Mekanisme animasi asli
   dipertahankan: pose SVG (front / side) + kelas CSS y67-anim-*, walk loop,
   perilaku acak, drag & lempar.

   Perubahan terbaru:
   - Animasi jatuh (arrival/cinematic + langit) DIHAPUS. Intro baru dirancang
     terpisah nanti.
   - Lynuxs tampil sepanjang halaman (tidak lagi disembunyikan saat #beranda
     tergulir lewat).
   - Klik ganda / ketuk dua kali / Enter membuka MENU ASLI proyek lama
     (js/lynuxs-features.js: Kalkulator / Lynuxs AI / FAQ).

   Perubahan IDLE (default DIAM):
 - Lynuxs kini diam di pojok kanan bawah (IDLE_MODE = true). Semua pemicu
   OTOMATIS (jalan, perilaku acak, menoleh ke kursor) dimatikan di titik
   masuknya (nextLeg / maybeLookAtCursor). KODE ANIMASI LAMA TIDAK DIHAPUS.
 - Animasi lama dipanggil kembali lewat interaksi: ketuk/klik SEKALI =
   satu animasi lama acak; seret & lempar = fisika lama; klik ganda = menu.
 - Mode jalan-jalan penuh: tambahkan ?lynuxs=active pada URL, atau panggil
   window.Lynuxs.setIdle(false) di konsol. window.Lynuxs.play("hop") dst.

 Semua id/class berawalan y67- / yusmentoro67- agar tidak bentrok dengan
   kode situs IPS. Seluruh script berada di dalam IIFE.
   ========================================================================== */

(function () {
	"use strict";

	var Y67_DEBUG = (function () {
		try {
			return /[?&]y67debug=1(?:&|$)/.test(window.location.search);
		} catch (e) {
			return false;
		}
	})();
	function y67Log() {
		if (!Y67_DEBUG) return;
		try {
			var a = Array.prototype.slice.call(arguments);
			a.unshift("[Y67 CINEMATIC]");
			console.log.apply(console, a);
		} catch (e) {}
	}

	var charEl = document.getElementById("yusmentoro67Char");
	var flipEl = document.getElementById("yusmentoro67Flip");
	var bodyEl = document.getElementById("yusmentoro67Body");
	var bubbleEl = document.getElementById("yusmentoro67Bubble");
	var dustEl = document.getElementById("y67Dust");

	if (!charEl || !flipEl || !bodyEl || !bubbleEl) {
		y67Log("FATAL: required DOM elements missing, script aborted");
		return;
	}

	var prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches;

	var currentLiftY = 0;
	var currentTilt = 0;

	var pointerId = null;
	var pointerMode = "idle";
	var pStartClientX = 0,
		pStartClientY = 0,
		pCharStartX = 0,
		pCharStartY = 0;
	var pLastClientX = 0,
		pLastClientY = 0,
		pLastMoveTime = 0;
	var pVelX = 0,
		pVelY = 0;
	var lastTapUpTime = 0;

	var throwState = null;
	var throwRAFId = null;

	var DRAG_THRESHOLD_PX = 10;
	var DOUBLE_TAP_MS = 350;
	var THROW_GRAVITY = 2800;
	var THROW_AIR_DAMPING = 0.55;
	var THROW_END_SPEED = 25;

	var specialState = null;
	var specialCooldownUntil = 0;

	var SPECIAL_COOLDOWN_MS = 20000;
	var SPECIAL_CHANCE = 0.22;
	var SLEEP_DURATION_MS = 8000;



	var bootstrapDone = false;

  /* ★ IDLE: default diam. ?lynuxs=active mengaktifkan kembali mode jalan. */
  var IDLE_MODE = !/[?&]lynuxs=active(?:&|$)/.test(window.location.search);
  var IDLE_MARGIN_PX = 10;
  var tapReactTimer = null;
  function idleAnchorX() {
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var cw = charEl.offsetWidth || 60;
    return Math.max(0, vw - cw - IDLE_MARGIN_PX);
  }

	function ensureCharVisible() {
		if (!charEl) return;
		charEl.style.visibility = "";
		charEl.style.opacity = "";
	}

	var GENERIC_COMMENTS = [
		"Hmm...",
		"Hmm?",
		"ah...",
		"Idc",
		"Idk",
		"...",
		"Derap...",
		"Yupi...",
		"🤓",
		"?",
		"@#!$%",
		"Gokil",
		"ugh..."
	];
	var DEFAULT_TRACK = { min: 4, max: 72 };
	function getTrack() {
		return DEFAULT_TRACK;
	}

	var posPx = 0;
	var dir = 1;
	var boundsMinPx = 0,
		boundsMaxPx = 0;
	var walkTimer = null;
	var panelOpen = false;
	var SPEED_PX_S = 24;

	function scheduleTimer(fn, ms) {
		clearScheduledTimer();
		walkTimer = setTimeout(fn, ms);
	}
	function clearScheduledTimer() {
		if (walkTimer) {
			clearTimeout(walkTimer);
			walkTimer = null;
		}
	}

	function isBusy() {
		return (
			panelOpen ||
			pointerMode !== "idle" ||
			specialState !== null
		);
	}

	function recomputeBounds() {
		var t = getTrack();
		var vw = window.innerWidth || document.documentElement.clientWidth;
		boundsMinPx = (vw * t.min) / 100;
		boundsMaxPx = (vw * t.max) / 100;
		if (posPx < boundsMinPx) posPx = boundsMinPx;
		if (posPx > boundsMaxPx) posPx = boundsMaxPx;
	}

	function applyPosition(px, transitionSec) {
		charEl.style.transition =
			"transform " +
			transitionSec +
			"s linear, bottom 260ms ease, width 260ms ease, height 260ms ease";
		charEl.style.transform =
			"translate3d(" +
			px +
			"px, " +
			currentLiftY +
			"px, 0)";
	}

	function applyFacing(newDir, transitionSec) {
		flipEl.style.transitionDuration = (transitionSec || 0.26) + "s";
		flipEl.style.transform =
			"rotate(" + currentTilt + "deg) scaleX(" + newDir + ")";
	}
	function setTilt(t) {
		currentTilt = t;
		flipEl.style.transform =
			"rotate(" + currentTilt + "deg) scaleX(" + dir + ")";
	}

	function playAnim(className, duration, cb) {
		bodyEl.classList.remove("is-walking");
		bodyEl.classList.add(className);
		scheduleBehaviorEnd(function () {
			bodyEl.classList.remove(className);
			if (cb) cb();
		}, duration);
	}

	var behaviorTimer = null;
	function scheduleBehaviorEnd(fn, ms) {
		if (behaviorTimer) clearTimeout(behaviorTimer);
		behaviorTimer = setTimeout(fn, ms);
	}

	var BEHAVIORS = [
		{
			name: "stop",
			tier: "common",
			weight: 12,
			run: function (cb) {
				bodyEl.classList.remove("is-walking");
				scheduleBehaviorEnd(cb, 900 + Math.random() * 700);
			}
		},
		{
			name: "suddenstop",
			tier: "common",
			weight: 10,
			run: function (cb) {
				bodyEl.classList.remove("is-walking");
				bodyEl.classList.add("y67-anim-brake");
				scheduleBehaviorEnd(function () {
					bodyEl.classList.remove("y67-anim-brake");
					scheduleBehaviorEnd(cb, 500 + Math.random() * 400);
				}, 220);
			}
		},
		{
			name: "headtilt",
			tier: "common",
			weight: 14,
			run: function (cb) {
				playAnim("y67-anim-look", 900, cb);
			}
		},
		{
			name: "lookup",
			tier: "common",
			weight: 10,
			run: function (cb) {
				playAnim("y67-anim-lookup", 1000, cb);
			}
		},
		{
			name: "lookback",
			tier: "common",
			weight: 9,
			run: function (cb) {
				playAnim("y67-anim-lookback", 950, cb);
			}
		},
		{
			name: "lookdown",
			tier: "common",
			weight: 8,
			run: function (cb) {
				playAnim("y67-anim-lookdown", 850, cb);
			}
		},
		{
			name: "glasses",
			tier: "uncommon",
			weight: 7,
			run: function (cb) {
				playAnim("y67-anim-glasses", 480, cb);
			}
		},
		{
			name: "hop",
			tier: "uncommon",
			weight: 6,
			run: function (cb) {
				playAnim("y67-anim-hop", 480, cb);
			}
		},
		{
			name: "bounce",
			tier: "uncommon",
			weight: 6,
			run: function (cb) {
				playAnim("y67-anim-bounce", 600, cb);
			}
		},
		{
			name: "confused",
			tier: "uncommon",
			weight: 6,
			run: function (cb) {
				bodyEl.classList.remove("is-walking");
				bodyEl.classList.add("y67-anim-confused");
				showBubble("Hmm?", null, 1200);
				scheduleBehaviorEnd(function () {
					bodyEl.classList.remove("y67-anim-confused");
					cb();
				}, 1100);
			}
		},
		{
			name: "glance",
			tier: "uncommon",
			weight: 6,
			run: function (cb) {
				playAnim("y67-anim-glance", 700, cb);
			}
		},
		{
			name: "quickturn",
			tier: "rare",
			weight: 3,
			run: function (cb) {
				playAnim("y67-anim-quickturn", 380, function () {
					dir = -dir;
					applyFacing(dir, 0.15);
					cb();
				});
			}
		},
		{
			name: "sleep",
			tier: "rare",
			weight: 2,
			run: function (cb) {
				playAnim("y67-anim-sleep", 1900, cb);
			}
		},
		{
			name: "stumble",
			tier: "rare",
			weight: 2,
			run: function (cb) {
				playAnim("y67-anim-stumble", 620, cb);
			}
		}
	];

	function pickBehavior() {
		var total = 0;
		for (var i = 0; i < BEHAVIORS.length; i++) total += BEHAVIORS[i].weight;
		var r = Math.random() * total;
		for (var j = 0; j < BEHAVIORS.length; j++) {
			r -= BEHAVIORS[j].weight;
			if (r <= 0) return BEHAVIORS[j];
		}
		return BEHAVIORS[0];
	}

	function pickBehaviorForSlide() {
		return pickBehavior();
	}

	function pickCommentText() {
		return GENERIC_COMMENTS[
			Math.floor(Math.random() * GENERIC_COMMENTS.length)
		];
	}

	var bubbleTimer = null;
	function showBubble(text, cb, customDurationMs) {
		if (bubbleTimer) clearTimeout(bubbleTimer);
		bubbleEl.textContent = text;
		bubbleEl.classList.add("is-visible");
		var duration =
			typeof customDurationMs === "number"
				? customDurationMs
				: 1300 + Math.random() * 1200;
		bubbleTimer = setTimeout(function () {
			bubbleEl.classList.remove("is-visible");
			if (cb) cb();
		}, duration);
	}
	function maybeShowBubble(prob) {
		if (panelOpen) return;
		if (Math.random() > prob) return;
		showBubble(pickCommentText());
	}

	function nextLeg() {
    if (IDLE_MODE) return; /* diam: tidak ada gerak otomatis */
    if (isBusy() || prefersReducedMotion) return;
		recomputeBounds();
		var trackLen = boundsMaxPx - boundsMinPx;
		if (trackLen <= 4) {
			scheduleTimer(nextLeg, 2000);
			return;
		}
		var goToBoundary = Math.random() < 0.35;
		var target;
		if (goToBoundary) {
			target = dir === 1 ? boundsMaxPx : boundsMinPx;
		} else {
			var minStep = trackLen * 0.18,
				maxStep = trackLen * 0.5;
			var step = minStep + Math.random() * (maxStep - minStep);
			target =
				dir === 1
					? Math.min(boundsMaxPx, posPx + step)
					: Math.max(boundsMinPx, posPx - step);
		}
		var distance = Math.abs(target - posPx);
		var duration = Math.min(9, Math.max(0.9, distance / SPEED_PX_S));
		bodyEl.classList.add("is-walking");
		applyPosition(target, duration);
		var arrivedAtBoundary =
			Math.abs(target - boundsMaxPx) < 0.5 ||
			Math.abs(target - boundsMinPx) < 0.5;
		posPx = target;
		scheduleTimer(function () {
			bodyEl.classList.remove("is-walking");
			if (isBusy()) return;
			if (arrivedAtBoundary) handleBoundary();
			else maybeBehaviorThenContinue();
		}, duration * 1000);
	}

	function handleBoundary() {
		if (isBusy()) return;
		scheduleTimer(
			function () {
				if (isBusy()) return;
				playAnim("y67-anim-look", 900, function () {
					if (isBusy()) return;
					dir = -dir;
					applyFacing(dir);
					maybeShowBubble(0.3);
					scheduleTimer(nextLeg, 260);
				});
			},
			500 + Math.random() * 500
		);
	}

	function maybeBehaviorThenContinue() {
		if (isBusy()) return;
		if (canRunSpecial() && Math.random() < SPECIAL_CHANCE) {
			if (Math.random() < 0.5) startSleep();
			else startCleanGlasses();
			return;
		}
		if (Math.random() < 0.55) {
			var b = pickBehaviorForSlide();
			b.run(function () {
				if (isBusy()) return;
				maybeShowBubble(0.32);
				scheduleTimer(nextLeg, 150);
			});
		} else {
			scheduleTimer(nextLeg, 150);
		}
	}

	function canRunSpecial() {
		return (
			!specialState &&
			!prefersReducedMotion &&
			Date.now() > specialCooldownUntil
		);
	}

	function cancelSpecial(reason) {
		if (!specialState) return;
		clearScheduledTimer();
		if (bubbleTimer) {
			clearTimeout(bubbleTimer);
			bubbleTimer = null;
		}
		bubbleEl.classList.remove("is-visible");
		bodyEl.classList.remove("is-walking");
		bodyEl.classList.remove.apply(bodyEl.classList, ALL_ANIM_CLASSES);
		specialState = null;
		specialCooldownUntil = Date.now() + 15000;
	}

	function triggerDustBurst() {
		if (!dustEl) return;
		dustEl.classList.remove("is-burst");
		void dustEl.offsetWidth;
		dustEl.classList.add("is-burst");
		setTimeout(function () {
			dustEl.classList.remove("is-burst");
		}, 900);
	}

	function startSleep() {
		if (!canRunSpecial()) return;
		specialState = "sleep";
		clearScheduledTimer();
		bodyEl.classList.remove("is-walking");
		bodyEl.classList.remove.apply(bodyEl.classList, ALL_ANIM_CLASSES);
		bodyEl.classList.add("y67-anim-sleepy");
		scheduleTimer(function () {
			bodyEl.classList.remove("y67-anim-sleepy");
			bodyEl.classList.add("y67-anim-sleep-deep");
			showBubble("Zzz...", null, SLEEP_DURATION_MS - 1200);
			scheduleTimer(function () {
				bodyEl.classList.remove("y67-anim-sleep-deep");
				bodyEl.classList.add("y67-anim-wake");
				scheduleTimer(function () {
					bodyEl.classList.remove("y67-anim-wake");
					specialState = null;
					specialCooldownUntil = Date.now() + SPECIAL_COOLDOWN_MS;
					scheduleTimer(nextLeg, 400);
				}, 600);
			}, SLEEP_DURATION_MS);
		}, 500);
	}

	function startCleanGlasses() {
		if (!canRunSpecial()) return;
		specialState = "cleanglass";
		clearScheduledTimer();
		bodyEl.classList.remove("is-walking");
		bodyEl.classList.remove.apply(bodyEl.classList, ALL_ANIM_CLASSES);
		bodyEl.classList.add("y67-anim-clean-glasses");
		scheduleTimer(function () {
			bodyEl.classList.remove("y67-anim-clean-glasses");
			specialState = null;
			specialCooldownUntil = Date.now() + SPECIAL_COOLDOWN_MS;
			scheduleTimer(nextLeg, 400);
		}, 2100);
	}

	/* ★ Menu asli proyek lama (STEP 7): openSequence delegasi ke
	   window.LynuxsFeatures (js/lynuxs-features.js, dipindahkan apa adanya).
	   Menu 3-ikon: Kalkulator / Lynuxs AI / FAQ. */
	function openSequence() {
		if (
			!window.LynuxsFeatures ||
			typeof window.LynuxsFeatures.openMenu !== "function"
		) {
			y67Log("LynuxsFeatures not ready, openSequence aborted");
			return;
		}
		if (
			window.LynuxsFeatures.isAnyOpen &&
			window.LynuxsFeatures.isAnyOpen()
		) {
			window.LynuxsFeatures.closeAll();
			return;
		}
		if (panelOpen) return;
		panelOpen = true;
		clearScheduledTimer();
		if (behaviorTimer) clearTimeout(behaviorTimer);
		bodyEl.classList.remove("is-walking");
		bubbleEl.classList.remove("is-visible");
		/* bekukan posisi (jika sedang berjalan, mis. dibuka lewat Enter) */
		posPx = charEl.getBoundingClientRect().left;
		charEl.style.transition = "none";
		setCharImmediate(posPx, currentLiftY);

		if (prefersReducedMotion) {
			window.LynuxsFeatures.openMenu();
			return;
		}

		var CLICK_LOOK_MS = 480;
		bodyEl.classList.add("y67-anim-click-look");
		setTimeout(function () {
			bodyEl.classList.remove("y67-anim-click-look");
			window.LynuxsFeatures.openMenu();
		}, CLICK_LOOK_MS);
	}

	window.addEventListener("lynuxs:menu-closed", function () {
		if (!panelOpen) return;
		panelOpen = false;
		scheduleTimer(nextLeg, 400);
	});

	document.addEventListener("keydown", function (e) {
		if (
			e.key === "Escape" &&
			window.LynuxsFeatures &&
			window.LynuxsFeatures.isAnyOpen &&
			window.LynuxsFeatures.isAnyOpen()
		) {
			window.LynuxsFeatures.closeAll();
		}
	});

	function stopAllBehaviors() {
		clearScheduledTimer();
		if (behaviorTimer) {
			clearTimeout(behaviorTimer);
			behaviorTimer = null;
		}
		bodyEl.classList.remove("is-walking");
		bodyEl.classList.remove.apply(bodyEl.classList, ALL_ANIM_CLASSES);
		cursorLookBusy = false;
	}

	function setCharImmediate(px, y) {
		charEl.style.transform = "translate3d(" + px + "px, " + y + "px, 0)";
	}

	function viewportClampX(x) {
		var vw = window.innerWidth || document.documentElement.clientWidth;
		var cw = charEl.offsetWidth || 50;
		var min = 0,
			max = vw - cw;
		if (max < min) max = min;
		if (x < min) x = min;
		if (x > max) x = max;
		return x;
	}
	function viewportMaxLift() {
		var vh = window.innerHeight || document.documentElement.clientHeight;
		var ch = charEl.offsetHeight || 50;
		var m = vh - ch - 12;
		return m > 0 ? m : 0;
	}

	function onPointerDown(e) {
		if (panelOpen) return;
		if (e.pointerType === "mouse" && e.button !== 0) return;
		if (pointerMode !== "idle") return;
		if (specialState) cancelSpecial("pointerdown");
    if (tapReactTimer) { clearTimeout(tapReactTimer); tapReactTimer = null; }

		var rect = charEl.getBoundingClientRect();
		posPx = rect.left;
		var bottomPx = parseFloat(getComputedStyle(charEl).bottom) || 0;
		currentLiftY =
			rect.top - (window.innerHeight - bottomPx - charEl.offsetHeight);
		if (currentLiftY > 0) currentLiftY = 0;
		charEl.style.transition = "none";
		setCharImmediate(posPx, currentLiftY);

		pointerId = e.pointerId;
		pointerMode = "pending";
		pStartClientX = e.clientX;
		pStartClientY = e.clientY;
		pCharStartX = posPx;
		pCharStartY = currentLiftY;
		pLastClientX = e.clientX;
		pLastClientY = e.clientY;
		pLastMoveTime = performance.now();
		pVelX = 0;
		pVelY = 0;
		stopAllBehaviors();
		try {
			charEl.setPointerCapture(e.pointerId);
		} catch (err) {}
	}

	function onPointerMove(e) {
		if (pointerId === null || e.pointerId !== pointerId) return;
		if (pointerMode === "idle" || pointerMode === "throw") return;
		var dx = e.clientX - pStartClientX;
		var dy = e.clientY - pStartClientY;
		var distSq = dx * dx + dy * dy;
		if (pointerMode === "pending") {
			if (distSq < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
			pointerMode = "drag";
			charEl.style.transition = "none";
			flipEl.style.transitionDuration = "0.08s";
			bodyEl.classList.remove("is-walking");
			bodyEl.classList.remove.apply(bodyEl.classList, ALL_ANIM_CLASSES);
			bodyEl.classList.add("is-held");
			charEl.classList.add("is-grabbing");
		}
		var newX = viewportClampX(pCharStartX + dx);
		var newY = pCharStartY + dy;
		var maxLift = viewportMaxLift();
		if (newY > 0) newY = 0;
		if (newY < -maxLift) newY = -maxLift;
		posPx = newX;
		currentLiftY = newY;
		setCharImmediate(posPx, currentLiftY);

		var now = performance.now();
		var dt = (now - pLastMoveTime) / 1000;
		if (dt > 0.005) {
			var ivx = (e.clientX - pLastClientX) / dt;
			var ivy = (e.clientY - pLastClientY) / dt;
			pVelX = pVelX * 0.6 + ivx * 0.4;
			pVelY = pVelY * 0.6 + ivy * 0.4;
			pLastClientX = e.clientX;
			pLastClientY = e.clientY;
			pLastMoveTime = now;
			if (Math.abs(pVelX) > 120) {
				var nd = pVelX > 0 ? 1 : -1;
				if (nd !== dir) {
					dir = nd;
					applyFacing(dir, 0.15);
				}
			}
			var tilt = pVelX * 0.025;
			if (tilt > 12) tilt = 12;
			if (tilt < -12) tilt = -12;
			setTilt(tilt);
		}
	}

	function onPointerUp(e) {
		if (pointerId === null || e.pointerId !== pointerId) return;
		var wasMode = pointerMode;
		pointerId = null;
		try {
			charEl.releasePointerCapture(e.pointerId);
		} catch (err) {}
		if (wasMode === "pending") {
			pointerMode = "idle";
			/* STEP 7.1 — ketuk tunggal saat panel fitur terbuka → tutup panel. */
			if (
				window.LynuxsFeatures &&
				typeof window.LynuxsFeatures.isAnyOpen === "function" &&
				window.LynuxsFeatures.isAnyOpen()
			) {
				window.LynuxsFeatures.closeAll();
				lastTapUpTime = 0;
				return;
			}
			var now = performance.now();
			if (now - lastTapUpTime < DOUBLE_TAP_MS) {
				lastTapUpTime = 0;
				openSequence();
			} else {
				lastTapUpTime = now;
				scheduleTimer(nextLeg, 400);
        if (IDLE_MODE) scheduleTapReaction();
			}
			return;
		}
		if (wasMode === "drag") {
			charEl.classList.remove("is-grabbing");
			bodyEl.classList.remove("is-held");
			var idleMs = performance.now() - pLastMoveTime;
			if (idleMs > 150) {
				pVelX = 0;
				pVelY = 0;
			}
			startThrow();
			return;
		}
		pointerMode = "idle";
	}

	function onPointerCancel(e) {
		if (pointerId === null || e.pointerId !== pointerId) return;
		try {
			charEl.releasePointerCapture(e.pointerId);
		} catch (err) {}
		pVelX = 0;
		pVelY = 0;
		if (pointerMode === "drag") {
			charEl.classList.remove("is-grabbing");
			bodyEl.classList.remove("is-held");
			startThrow();
		} else {
			pointerMode = "idle";
			scheduleTimer(nextLeg, 300);
		}
		pointerId = null;
	}

	function startThrow() {
		pointerMode = "throw";
		bodyEl.classList.remove.apply(bodyEl.classList, ALL_ANIM_CLASSES);
		bodyEl.classList.remove("is-walking");
		throwState = {
			x: posPx,
			y: currentLiftY,
			vx: pVelX,
			vy: pVelY,
			lastTime: performance.now(),
			landed: currentLiftY >= -0.5 && pVelY >= 0
		};
		charEl.style.transition = "none";
		flipEl.style.transitionDuration = "0.08s";
		throwRAFId = requestAnimationFrame(throwStep);
	}

	function throwStep(now) {
		if (!throwState) return;
		var dt = (now - throwState.lastTime) / 1000;
		throwState.lastTime = now;
		if (dt > 0.05) dt = 0.05;
		if (dt < 0) dt = 0;
		throwState.vy += THROW_GRAVITY * dt;
		throwState.vx *= Math.pow(THROW_AIR_DAMPING, dt);
		throwState.x += throwState.vx * dt;
		throwState.y += throwState.vy * dt;

		var vw = window.innerWidth || document.documentElement.clientWidth;
		var cw = charEl.offsetWidth || 50;
		if (throwState.x < 0) {
			throwState.x = 0;
			throwState.vx = -throwState.vx * 0.35;
		} else if (throwState.x > vw - cw) {
			throwState.x = vw - cw;
			throwState.vx = -throwState.vx * 0.35;
		}

		var justLanded = false;
		if (throwState.y > 0) {
			throwState.y = 0;
			if (throwState.vy > 0) {
				if (throwState.vy > 140) {
					throwState.vy = -throwState.vy * 0.32;
				} else {
					throwState.vy = 0;
					if (!throwState.landed) justLanded = true;
					throwState.landed = true;
				}
			}
		}
		posPx = throwState.x;
		currentLiftY = throwState.y;
		setCharImmediate(posPx, currentLiftY);

		var tilt = throwState.vx * 0.025;
		if (tilt > 15) tilt = 15;
		if (tilt < -15) tilt = -15;
		setTilt(tilt);

		if (justLanded) {
			bodyEl.classList.add("y67-anim-land");
			setTimeout(function () {
				bodyEl.classList.remove("y67-anim-land");
			}, 520);
		}
		var speedSq =
			throwState.vx * throwState.vx + throwState.vy * throwState.vy;
		var yStable = Math.abs(throwState.y) < 0.5;
		if (
			yStable &&
			throwState.landed &&
			speedSq < THROW_END_SPEED * THROW_END_SPEED
		) {
			endThrow();
			return;
		}
		throwRAFId = requestAnimationFrame(throwStep);
	}

	function endThrow() {
		if (throwRAFId) {
			cancelAnimationFrame(throwRAFId);
			throwRAFId = null;
		}
		throwState = null;
		charEl.style.transition = "";
		flipEl.style.transitionDuration = "";
		recomputeBounds();
		if (posPx < boundsMinPx) posPx = boundsMinPx;
		if (posPx > boundsMaxPx) posPx = boundsMaxPx;
    if (IDLE_MODE) posPx = idleAnchorX(); /* kembali ke pojok kanan bawah */
    currentLiftY = 0;
		currentTilt = 0;
		applyFacing(dir, 0.22);
		applyPosition(posPx, 0.28);
		pointerMode = "idle";
		scheduleTimer(nextLeg, 900);
	}

	charEl.addEventListener("pointerdown", onPointerDown);
	document.addEventListener("pointermove", onPointerMove, { passive: true });
	document.addEventListener("pointerup", onPointerUp, { passive: true });
	document.addEventListener("pointercancel", onPointerCancel, {
		passive: true
	});

	charEl.addEventListener("click", function (e) {
		/* STEP 7.2 — klik Lynuxs menutup menu/panel fitur yang terbuka. */
		if (
			window.LynuxsFeatures &&
			typeof window.LynuxsFeatures.isAnyOpen === "function" &&
			window.LynuxsFeatures.isAnyOpen()
		) {
			e.preventDefault();
			e.stopPropagation();
			window.LynuxsFeatures.closeAll();
			return;
		}
		if (panelOpen) return;
		if (e.detail === 0) {
			e.preventDefault();
			openSequence();
		}
	});

	var ALL_ANIM_CLASSES = [
		"y67-anim-look",
		"y67-anim-click-look",
		"y67-anim-lookup",
		"y67-anim-lookdown",
		"y67-anim-hop",
		"y67-anim-bounce",
		"y67-anim-glance",
		"y67-anim-quickturn",
		"y67-anim-brake",
		"y67-anim-confused",
		"y67-anim-stumble",
		"y67-anim-sleep",
		"y67-anim-lookback",
		"y67-anim-glasses",
		"y67-anim-land",
		"y67-anim-sleepy",
		"y67-anim-sleep-deep",
		"y67-anim-wake",
		"y67-anim-clean-glasses"
	];

	window.addEventListener("resize", function () {
		recomputeBounds();
    if (IDLE_MODE && pointerMode === "idle" && !throwState) { posPx = idleAnchorX(); applyPosition(posPx, 0); }
	});

	if (!prefersReducedMotion) {
		var lastCursorCheckAt = 0,
			lastCursorTriggerAt = 0;
		var cursorLookBusy = false;
		var CURSOR_CHECK_INTERVAL_MS = 400;
		var CURSOR_COOLDOWN_MS = 9000;
		var CURSOR_PROXIMITY_PX = 130;

		var maybeLookAtCursor = function (clientX, clientY) {
        if (IDLE_MODE) return; /* diam: tidak menoleh otomatis */
			if (cursorLookBusy) return;
			if (isBusy()) return;
			if (bodyEl.className.indexOf("y67-anim-") !== -1) return;
			var now = Date.now();
			if (now - lastCursorCheckAt < CURSOR_CHECK_INTERVAL_MS) return;
			lastCursorCheckAt = now;
			if (now - lastCursorTriggerAt < CURSOR_COOLDOWN_MS) return;
			var rect = charEl.getBoundingClientRect();
			var cx = rect.left + rect.width / 2;
			var cy = rect.top + rect.height / 2;
			var dx = clientX - cx;
			var dy = clientY - cy;
			if (Math.sqrt(dx * dx + dy * dy) > CURSOR_PROXIMITY_PX) return;
			lastCursorTriggerAt = now;
			cursorLookBusy = true;
			clearScheduledTimer();
			if (behaviorTimer) clearTimeout(behaviorTimer);
			var faceTowards = dx < 0 ? -1 : 1;
			var wasWalking = bodyEl.classList.contains("is-walking");
			bodyEl.classList.remove("is-walking");
			applyFacing(faceTowards, 0.22);
			playAnim("y67-anim-look", 700, function () {
				cursorLookBusy = false;
				if (panelOpen) return;
				applyFacing(dir, 0.22);
				if (wasWalking) bodyEl.classList.add("is-walking");
				scheduleTimer(nextLeg, 220);
			});
		};

		document.addEventListener(
			"mousemove",
			function (e) {
				maybeLookAtCursor(e.clientX, e.clientY);
			},
			{ passive: true }
		);
		document.addEventListener(
			"touchstart",
			function (e) {
				if (!e.touches || !e.touches[0]) return;
				maybeLookAtCursor(e.touches[0].clientX, e.touches[0].clientY);
			},
			{ passive: true }
		);
	}

	  /* Satu animasi lama acak setelah ketukan tunggal (bukan loop). */
  var TAP_POOL = ["headtilt", "hop", "bounce", "glance", "lookup", "lookdown", "confused", "glasses"];
  function playBehaviorByName(name) {
    if (prefersReducedMotion || isBusy()) return false;
    for (var i = 0; i < BEHAVIORS.length; i++) {
      if (BEHAVIORS[i].name === name) {
        BEHAVIORS[i].run(function () {});
        return true;
      }
    }
    return false;
  }
  function scheduleTapReaction() {
    if (tapReactTimer) clearTimeout(tapReactTimer);
    tapReactTimer = setTimeout(function () {
      tapReactTimer = null;
      playBehaviorByName(TAP_POOL[Math.floor(Math.random() * TAP_POOL.length)]);
    }, DOUBLE_TAP_MS + 40);
  }
  function setIdle(on) {
    IDLE_MODE = !!on;
    stopAllBehaviors();
    if (IDLE_MODE) {
      posPx = idleAnchorX();
      applyPosition(posPx, 0.3);
    } else if (!prefersReducedMotion) {
      recomputeBounds();
      scheduleTimer(nextLeg, 600);
    }
  }
  /* API publik kecil: memanggil kembali animasi lama kapan saja. */
  window.Lynuxs = {
    isIdle: function () { return IDLE_MODE; },
    setIdle: setIdle,
    play: playBehaviorByName,
    behaviors: function () { return BEHAVIORS.map(function (b) { return b.name; }); }
  };

  function bootstrap() {
		if (bootstrapDone) return;
		bootstrapDone = true;

		recomputeBounds();
		posPx = IDLE_MODE ? idleAnchorX() : boundsMinPx + (boundsMaxPx - boundsMinPx) * 0.15;
		currentLiftY = 0;
		currentTilt = 0;
		applyPosition(posPx, 0);
		applyFacing(dir, 0);
		ensureCharVisible();

		if (prefersReducedMotion || IDLE_MODE) return;
		scheduleTimer(nextLeg, 1600);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", bootstrap, {
			once: true
		});
	} else {
		bootstrap();
	}
})();

