/* ==========================================================================
   RUPE-LUMPUNK — SUMBER TUNGGAL DESAIN UANG (dipakai index.html & page.html)
   Empat nominal: 10, 30, 67, 100. Dirender sebagai <symbol> SVG:
     <svg viewBox="0 0 600 300"><use href="#rplk-10" /></svg>
   (#note = alias 100 RPLK, agar markup lama di page.html tetap jalan.)

   ★ CARA MENGISI GAMBAR DI LINGKARAN TENGAH
   1. Simpan gambar di folder assets/ (mis. assets/potret-10.png).
   2. Isi path-nya di RPLK_SLOT_IMAGES di bawah. Kosong ("") = placeholder.
   Gambar otomatis terpotong bulat & memenuhi slot (rasio bebas).
   Tidak perlu mengubah desain uang lainnya.
   ========================================================================== */
(function () {
	"use strict";

	var RPLK_SLOT_IMAGES = window.RPLK_SLOT_IMAGES || {
		10: "assets/10.png", // path relatif dari file HTML
		30: "assets/30.png", // path relatif dari file HTML
		67: "assets/67.png", // path relatif dari file HTML
		100: "assets/100.png" // path relatif dari file HTML
	};

	var G = "#183F32",
		GOLD = "#C7A45B",
		NAVY = "#192B45",
		RED = "#B62532",
		CREAM = "#F3EEDC",
		CX = 300,
		CY = 150,
		SLOT_R = 54;

	function f(n) {
		return Math.round(n * 100) / 100;
	}
	function ring(r, stroke, w, extra) {
		return (
			'<circle r="' +
			r +
			'" fill="none" stroke="' +
			stroke +
			'" stroke-width="' +
			w +
			'" ' +
			(extra || "") +
			" />"
		);
	}
	function star(n, ro, ri, rot) {
		var p = [];
		for (var i = 0; i < n * 2; i++) {
			var a = (Math.PI * i) / n + (rot || -Math.PI / 2),
				r = i % 2 ? ri : ro;
			p.push(f(Math.cos(a) * r) + "," + f(Math.sin(a) * r));
		}
		return p.join(" ");
	}
	function around(n, r, fn) {
		var s = "";
		for (var i = 0; i < n; i++) {
			var a = (360 / n) * i;
			s +=
				'<g transform="rotate(' +
				f(a) +
				") translate(0 -" +
				r +
				')">' +
				fn(i) +
				"</g>";
		}
		return s;
	}
	function band(x, y, w, h, fill, text, size, sp, tcol) {
		return (
			'<rect x="' +
			x +
			'" y="' +
			y +
			'" width="' +
			w +
			'" height="' +
			h +
			'" fill="' +
			fill +
			'" />' +
			'<rect x="' +
			(x + 4) +
			'" y="' +
			(y + 4) +
			'" width="' +
			(w - 8) +
			'" height="' +
			(h - 8) +
			'" fill="none" stroke="' +
			GOLD +
			'" />' +
			'<text x="300" y="' +
			(y + h / 2 + size * 0.36) +
			'" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="' +
			size +
			'" font-weight="700" fill="' +
			tcol +
			'" letter-spacing="' +
			sp +
			'">' +
			text +
			"</text>"
		);
	}
	function numeral(txt, x, y, size, col) {
		return (
			'<text x="' +
			x +
			'" y="' +
			y +
			'" text-anchor="middle" font-family="\'Playfair Display\',Georgia,serif" font-size="' +
			size +
			'" font-weight="900" fill="' +
			col +
			'" stroke="#F3EEDC" stroke-width="3.5" paint-order="stroke">' +
			txt +
			"</text>"
		);
	}
	function rplk(x, y, col) {
		return (
			'<text x="' +
			x +
			'" y="' +
			y +
			'" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="' +
			col +
			'" letter-spacing="4">RPLK</text>'
		);
	}
	function serial(t, col) {
		return (
			'<text x="50" y="92" font-family="monospace" font-size="10" font-weight="700" fill="' +
			col +
			'">' +
			t +
			"</text>" +
			'<text x="550" y="226" text-anchor="end" font-family="monospace" font-size="10" font-weight="700" fill="' +
			col +
			'">' +
			t +
			"</text>"
		);
	}
	function corners(fn) {
		return [
			[36, 36],
			[564, 36],
			[36, 264],
			[564, 264]
		]
			.map(function (p) {
				return (
					'<g transform="translate(' +
					p[0] +
					" " +
					p[1] +
					')">' +
					fn() +
					"</g>"
				);
			})
			.join("");
	}

	/* ---- SLOT GAMBAR LINGKARAN (sama posisinya di keempat uang) ---- */
	function slot(n, col) {
		var img = RPLK_SLOT_IMAGES[n];
		return (
			'<g class="rplk-slot" data-slot="' +
			n +
			'" transform="translate(' +
			CX +
			" " +
			CY +
			')">' +
			'<circle r="' +
			SLOT_R +
			'" fill="#F7F2E2" />' +
			(img
				? '<image href="' +
					img +
					'" x="-' +
					SLOT_R +
					'" y="-' +
					SLOT_R +
					'" width="' +
					SLOT_R * 2 +
					'" height="' +
					SLOT_R * 2 +
					'" preserveAspectRatio="xMidYMid slice" clip-path="url(#rp-clip)" />'
				: ring(46, col, 1, 'stroke-dasharray="3 3" opacity=".55"') +
					'<text y="-3" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="7" font-weight="700" fill="' +
					col +
					'" letter-spacing="1.6" opacity=".6">SLOT GAMBAR</text>' +
					'<text y="8" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="7" font-weight="700" fill="' +
					col +
					'" letter-spacing="1.6" opacity=".6">' +
					n +
					" RPLK</text>") +
			ring(SLOT_R, col, 1.4) +
			"</g>"
		);
	}

	/* ---- 10: elegan & sederhana (hijau sage, bingkai ganda polos) ---- */
	function n10() {
		return (
			'<rect width="600" height="300" rx="8" fill="#E7EBD3" />' +
			'<rect width="600" height="300" rx="8" fill="url(#rp-wave)" opacity=".28" />' +
			'<rect x="12" y="12" width="576" height="276" rx="4" fill="none" stroke="' +
			G +
			'" stroke-width="2.5" />' +
			'<rect x="20" y="20" width="560" height="260" fill="none" stroke="' +
			GOLD +
			'" stroke-width="1.2" />' +
			corners(function () {
				return (
					'<circle r="9" fill="' +
					CREAM +
					'" stroke="' +
					G +
					'" stroke-width="1.5" /><circle r="3" fill="' +
					GOLD +
					'" />'
				);
			}) +
			band(62, 34, 476, 34, G, "BANK PELUMPUNK", 17, 5, CREAM) +
			band(62, 232, 476, 34, G, "SEPULUH RUPE-LUMPUNK", 15, 3.5, CREAM) +
			'<g transform="translate(300 150)">' +
			ring(72, GOLD, 2.4) +
			ring(66, G, 1) +
			ring(60, GOLD, 1) +
			around(4, 72, function () {
				return '<circle r="3.2" fill="' + G + '" />';
			}) +
			"</g>" +
			slot(10, G) +
			numeral("10", 140, 172, 80, G) +
			rplk(140, 198, G) +
			'<g transform="translate(468 140)">' +
			ring(36, G, 1.6) +
			ring(31, GOLD, 1.2) +
			'<polygon points="' +
			star(4, 20, 6) +
			'" fill="' +
			G +
			'" /></g>' +
			numeral("10", 468, 204, 22, G) +
			serial("PL 010 0000 RPLK", G)
		);
	}

	/* ---- 30: geometris (biru navy, kisi belah ketupat, bingkai bintang-8) ---- */
	function n30() {
		return (
			'<rect width="600" height="300" rx="8" fill="#E1E6EA" />' +
			'<rect width="600" height="300" rx="8" fill="url(#rp-diamond)" opacity=".5" />' +
			'<rect x="10" y="10" width="580" height="280" rx="4" fill="none" stroke="' +
			NAVY +
			'" stroke-width="3.5" />' +
			'<rect x="17" y="17" width="566" height="266" fill="none" stroke="' +
			GOLD +
			'" stroke-width="1.5" stroke-dasharray="8 3" />' +
			'<rect x="24" y="24" width="552" height="252" fill="none" stroke="' +
			NAVY +
			'" stroke-width="1" />' +
			corners(function () {
				return (
					'<polygon points="0,-13 13,0 0,13 -13,0" fill="' +
					CREAM +
					'" stroke="' +
					NAVY +
					'" stroke-width="1.6" /><polygon points="0,-6 6,0 0,6 -6,0" fill="' +
					GOLD +
					'" />'
				);
			}) +
			band(62, 34, 476, 34, NAVY, "BANK PELUMPUNK", 17, 5, CREAM) +
			band(
				62,
				232,
				476,
				34,
				NAVY,
				"TIGA PULUH RUPE-LUMPUNK",
				15,
				3.5,
				CREAM
			) +
			'<g transform="translate(300 150)"><polygon points="' +
			star(8, 77, 64) +
			'" fill="#F1ECD9" stroke="' +
			NAVY +
			'" stroke-width="1.8" stroke-linejoin="round" />' +
			'<polygon points="' +
			star(8, 70, 60, -Math.PI / 2 + Math.PI / 8) +
			'" fill="none" stroke="' +
			GOLD +
			'" stroke-width="1.2" />' +
			ring(59, GOLD, 3) +
			ring(56, NAVY, 1) +
			"</g>" +
			slot(30, NAVY) +
			numeral("30", 140, 172, 80, NAVY) +
			rplk(140, 198, NAVY) +
			'<g transform="translate(468 140)"><polygon points="' +
			star(6, 38, 38, 0) +
			'" fill="' +
			CREAM +
			'" stroke="' +
			NAVY +
			'" stroke-width="2" />' +
			'<polygon points="' +
			star(6, 29, 29, 0) +
			'" fill="none" stroke="' +
			GOLD +
			'" stroke-width="1.5" />' +
			'<polygon points="0,-17 15,0 0,17 -15,0" fill="' +
			NAVY +
			'" /><polygon points="0,-8 7,0 0,8 -7,0" fill="' +
			GOLD +
			'" /></g>' +
			numeral("30", 468, 204, 22, NAVY) +
			serial("PL 030 0000 RPLK", RED)
		);
	}

	/* ---- 67: khas & berkarakter (merah anggur, sisik/renda, bingkai kelopak berlapis) ---- */
	function n67() {
		var W = "#7E1F2B";
		return (
			'<rect width="600" height="300" rx="8" fill="#EFDCCD" />' +
			'<rect width="600" height="300" rx="8" fill="url(#rp-scale)" opacity=".5" />' +
			'<rect x="9" y="9" width="582" height="282" rx="10" fill="none" stroke="' +
			W +
			'" stroke-width="4" />' +
			'<rect x="16" y="16" width="568" height="268" rx="6" fill="none" stroke="' +
			GOLD +
			'" stroke-width="2.4" stroke-dasharray="1 5" stroke-linecap="round" />' +
			'<rect x="24" y="24" width="552" height="252" rx="3" fill="none" stroke="' +
			W +
			'" stroke-width="1" />' +
			corners(function () {
				return (
					around(8, 9, function () {
						return (
							'<circle r="4.6" fill="' +
							CREAM +
							'" stroke="' +
							W +
							'" stroke-width="1.2" />'
						);
					}) +
					'<circle r="7" fill="' +
					GOLD +
					'" stroke="' +
					W +
					'" stroke-width="1" />'
				);
			}) +
			band(62, 34, 476, 34, W, "BANK PELUMPUNK", 17, 5, CREAM) +
			band(
				62,
				232,
				476,
				34,
				W,
				"ENAM PULUH TUJUH RUPE-LUMPUNK",
				14,
				2.6,
				CREAM
			) +
			'<g transform="translate(300 150)">' +
			around(24, 68, function () {
				return (
					'<circle r="8" fill="#F1E6D8" stroke="' +
					W +
					'" stroke-width="1.4" /><circle r="3" fill="' +
					GOLD +
					'" />'
				);
			}) +
			ring(70, GOLD, 1) +
			ring(60, W, 2.2) +
			ring(57, GOLD, 1.2, 'stroke-dasharray="2 2"') +
			"</g>" +
			slot(67, W) +
			numeral("67", 140, 172, 80, W) +
			rplk(140, 198, W) +
			'<g transform="translate(468 140)">' +
			around(10, 29, function () {
				return (
					'<ellipse rx="7" ry="13" fill="#F1E6D8" stroke="' +
					W +
					'" stroke-width="1.3" />'
				);
			}) +
			'<circle r="17" fill="' +
			GOLD +
			'" stroke="' +
			W +
			'" stroke-width="1.5" /><circle r="9" fill="' +
			W +
			'" /><circle r="3.5" fill="' +
			CREAM +
			'" /></g>' +
			numeral("67", 468, 204, 22, W) +
			serial("PL 067 0000 RPLK", W)
		);
	}

	/* ---- 100: nominal tertinggi (hijau hutan + emas, paling kaya) ---- */
	function n100() {
		var leaves = function (side) {
			var s = "";
			for (var i = 0; i < 11; i++) {
				var a = (110 + i * 13) * side,
					x = f(Math.cos(((a - 90) * Math.PI) / 180) * 69),
					y = f(Math.sin(((a - 90) * Math.PI) / 180) * 69);
				s +=
					'<ellipse cx="' +
					x +
					'" cy="' +
					y +
					'" rx="3.2" ry="8" transform="rotate(' +
					f(a + 20 * side) +
					" " +
					x +
					" " +
					y +
					')" fill="' +
					G +
					'" stroke="' +
					GOLD +
					'" stroke-width=".8" />';
			}
			return s;
		};
		return (
			'<rect width="600" height="300" rx="8" fill="#EFE8D0" />' +
			'<rect width="600" height="300" rx="8" fill="url(#rp-wave)" opacity=".4" />' +
			'<rect x="46" y="72" width="508" height="156" fill="url(#rp-diag)" opacity=".7" />' +
			'<rect x="10" y="10" width="580" height="280" rx="4" fill="none" stroke="url(#rp-gold)" stroke-width="5" />' +
			'<rect x="19" y="19" width="562" height="262" fill="none" stroke="' +
			G +
			'" stroke-width="1.5" />' +
			'<rect x="25" y="25" width="550" height="250" fill="none" stroke="' +
			GOLD +
			'" stroke-width="1" stroke-dasharray="5 3" />' +
			corners(function () {
				return (
					'<circle r="12" fill="' +
					CREAM +
					'" stroke="' +
					G +
					'" stroke-width="1.8" /><circle r="8" fill="none" stroke="' +
					GOLD +
					'" stroke-width="1.5" /><polygon points="' +
					star(8, 6, 2.2) +
					'" fill="' +
					G +
					'" />'
				);
			}) +
			band(62, 34, 476, 34, G, "BANK PELUMPUNK", 17, 5, CREAM) +
			band(62, 232, 476, 34, G, "SERATUS RUPE-LUMPUNK", 15, 3.5, CREAM) +
			'<g transform="translate(300 150)">' +
			around(48, 72, function (i) {
				return (
					'<line y2="' +
					(i % 2 ? 6 : 11) +
					'" stroke="' +
					GOLD +
					'" stroke-width="' +
					(i % 2 ? 1 : 1.8) +
					'" />'
				);
			}) +
			leaves(1) +
			leaves(-1) +
			ring(63, "url(#rp-gold)", 3.4) +
			ring(59, G, 1.2, 'stroke-dasharray="2 3"') +
			"</g>" +
			'<polygon transform="translate(300 76)" points="' +
			star(5, 6, 2.4) +
			'" fill="' +
			RED +
			'" />' +
			slot(100, G) +
			'<g transform="translate(88 118)">' +
			ring(22, G, 1.6) +
			ring(18, GOLD, 1.2) +
			ring(15, RED, 1.4) +
			'<polygon points="0,-12 7,9.7 -11.4,-3.7 11.4,-3.7 -7,9.7" fill="' +
			RED +
			'" /></g>' +
			numeral("100", 148, 184, 62, NAVY) +
			rplk(148, 206, G) +
			'<g transform="translate(468 138) scale(.8)"><ellipse rx="64" ry="60" fill="' +
			CREAM +
			'" stroke="' +
			G +
			'" stroke-width="2" /><ellipse rx="58" ry="54" fill="none" stroke="' +
			GOLD +
			'" stroke-width="1.5" />' +
			'<g stroke="' +
			NAVY +
			'" stroke-width="1.6" fill="#E8E0C9"><rect x="-44" y="34" width="88" height="6" /><rect x="-40" y="28" width="80" height="6" /><rect x="-34" y="-8" width="68" height="6" />' +
			'<polygon points="-38,-8 0,-30 38,-8" fill="' +
			NAVY +
			'" /><path d="M-14,-30a14 14 0 0 1 28 0z" fill="' +
			GOLD +
			'" /><line x1="0" y1="-44" x2="0" y2="-50" />' +
			'<rect x="-32" y="-2" width="7" height="30" /><rect x="-19" y="-2" width="7" height="30" /><rect x="-6" y="-2" width="12" height="30" fill="' +
			G +
			'" /><rect x="12" y="-2" width="7" height="30" /><rect x="25" y="-2" width="7" height="30" /></g></g>' +
			numeral("100", 468, 206, 22, NAVY) +
			serial("PL 100 0000 RPLK", RED)
		);
	}

	function sym(id, body) {
		return (
			'<symbol id="' +
			id +
			'" viewBox="0 0 600 300">' +
			body +
			"</symbol>"
		);
	}
	var defs =
		'<clipPath id="rp-clip"><circle cx="0" cy="0" r="' +
		SLOT_R +
		'" /></clipPath>' +
		'<linearGradient id="rp-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6C878" /><stop offset=".5" stop-color="#B8903F" /><stop offset="1" stop-color="#E9D08A" /></linearGradient>' +
		'<pattern id="rp-wave" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 5Q4 0 8 5T16 5M0 5Q4 10 8 5T16 5" fill="none" stroke="' +
		G +
		'" stroke-width=".7" /></pattern>' +
		'<pattern id="rp-diag" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12L12 0M-3 3L3 -3M9 15L15 9" stroke="' +
		GOLD +
		'" stroke-width=".8" /></pattern>' +
		'<pattern id="rp-diamond" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11 0L22 11L11 22L0 11Z" fill="none" stroke="' +
		NAVY +
		'" stroke-width=".6" /></pattern>' +
		'<pattern id="rp-scale" width="20" height="12" patternUnits="userSpaceOnUse"><path d="M0 12A10 10 0 0 1 20 12M-10 6A10 10 0 0 1 10 6M10 6A10 10 0 0 1 30 6" fill="none" stroke="#7E1F2B" stroke-width=".6" /></pattern>';

	var svg =
		'<svg id="rplk-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
		defs +
		sym("rplk-10", n10()) +
		sym("rplk-30", n30()) +
		sym("rplk-67", n67()) +
		sym("rplk-100", n100()) +
		'<symbol id="note" viewBox="0 0 600 300"><use href="#rplk-100" width="600" height="300" /></symbol></defs></svg>';

	function inject() {
		if (document.getElementById("rplk-sprite")) return;
		document.body.insertAdjacentHTML("afterbegin", svg);
	}
	if (document.body) inject();
	else document.addEventListener("DOMContentLoaded", inject);
})();
