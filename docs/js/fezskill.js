var SKILLPOINT_MARK = "-";
var SKILLPOINT_MARKED = "X";
var SKILLPOINT_LIMIT = 45;
var SKILLSLOT_SIZE = 8;
// キャラクタークラス列挙
var CHARACTER_CLASS = {
	WARRIOR: "warrior",
	SCOUT: "scout",
	SORCERER: "sorcerer",
	FENCER: "fencer",
	CESTUS: "cestus"
};
// 表ファイル所在
TABLE_DIR = "table/";
// 表ファイル拡張子
TABLE_EXTENTION = ".tsv";

// レベルコードでない文字
var LEVELS_UNCODE = /[^a-zA-Z\(\)\[\]\{\}\<\>\,\.\/\_]/g;
var LEVELS_ENCODE = {"000": "a", "001": "b", "002": "c", "003": "d", "010": "e", "011": "f", "012": "g", "013": "h", "020": "i", "021": "j", "022": "k", "023": "l", "030": "m", "031": "n", "032": "o", "033": "p", "100": "q", "101": "r", "102": "s", "103": "t", "110": "u", "111": "v", "112": "w", "113": "x", "120": "y", "121": "z", "122": "A", "123": "B", "130": "C", "131": "D", "132": "E", "133": "F", "200": "G", "201": "H", "202": "I", "203": "J", "210": "K", "211": "L", "212": "M", "213": "N", "220": "O", "221": "P", "222": "Q", "223": "R", "230": "S", "231": "T", "232": "U", "233": "V", "300": "W", "301": "X", "302": "Y", "303": "Z", "310": "(", "311": ")", "312": "[", "313": "]", "320": "{", "321": "}", "322": "<", "323": ">", "330": ",", "331": ".", "332": "/", "333": "_"};
var LEVELS_DECODE = {a: "000", b: "001", c: "002", d: "003", e: "010", f: "011", g: "012", h: "013", i: "020", j: "021", k: "022", l: "023", m: "030", n: "031", o: "032", p: "033", q: "100", r: "101", s: "102", t: "103", u: "110", v: "111", w: "112", x: "113", y: "120", z: "121", A: "122", B: "123", C: "130", D: "131", E: "132", F: "133", G: "200", H: "201", I: "202", J: "203", K: "210", L: "211", M: "212", N: "213", O: "220", P: "221", Q: "222", R: "223", S: "230", T: "231", U: "232", V: "233", W: "300", X: "301", Y: "302", Z: "303", "(": "310", ")": "311", "[": "312", "]": "313", "{": "320", "}": "321", "<": "322", ">": "323", ",": "330", ".": "331", "/": "332", "_": "333"};
/**
 * TSVファイルのパース結果を持つクラス
 * @param {CHARACTER_CLASS} characterClass キャラクタクラス
 * @returns {undefined}
 */
function Tsv(characterClass) {
	var filePath = this.filePath = TABLE_DIR + characterClass + TABLE_EXTENTION;
	var tableData;
	// ファイル内容をajax後も使うからasync: false
	try {
		$.ajax({
			url: filePath,
			dataType: "text",
			async: false
		}).done(function(data) {
			tableData = $.parse(data).results;
		}).fail(function(data) {
			var message = "file not found: " + filePath;
			console.log(message);
		});
	} catch (e) {
		console.log(e);
		console.log("filePath: " + filePath);
	}
	// 抽出データをプロパティで受ける
	this.data = tableData;
}

Tsv.prototype = {
	/**
	 * table要素として出力する
	 * http://venzol.blogspot.jp/2013/12/javascriptcsv-jquery.html
	 * @returns {undefined}
	 */
	show: function() {
		if (typeof (this.data) === void(0)) {
			$("div#showTable").append("<p>" + this.filePath + ": no data</p>");
			return;
		}
		var tableData = this.data;
		var table = $("<table />").appendTo($("div#showTable"));
		// table caption
		table.append($("<caption />", {"text": this.filePath}));
		// table header
		var thead = $("<thead />");
		thead.appendTo(table);
		var tr = $("<tr />");
		tr.appendTo(thead);
		tableData.fields.forEach(function(col) {
			tr.append($("<th />", {"text": col}));
		});
		// table body
		tableData.rows.forEach(function(row) {
			var tr = $("<tr />");
			tr.appendTo(table);
			tableData.fields.forEach(function(col) {
				tr.append($("<td />", {"text": row[col]}));
			});
		});
	}
};
/**
 * スキルデータクラス
 * @param {papaParse().results} tsvRow
 * @returns {Skill}
 */
function Skill(tsvRow) {
	// ID Characterは[A-Za-z0-9]1字
	this.idc = tsvRow["idc"];
	this.id = tsvRow["id"];
	this.name = tsvRow["name"];
	this.maxLevel = parseInt(tsvRow["maxLevel"]);
	this.lower = tsvRow["lower"];
	this.upper = tsvRow["upper"];
	this.level1 = parseInt(tsvRow["level1"]);
	this.level2 = parseInt(tsvRow["level2"]);
	this.level3 = parseInt(tsvRow["level3"]);
	this.description = tsvRow["description"];
	this.level = this.initialLevel = parseInt(tsvRow["initialLevel"]);
	// PowerTip設定
	$("td#" + this.id).find("span.skillname").data("powertiptarget", "tip" + this.id);
}

Skill.prototype = {
	/**
	 * スキルポイント消費マーク
	 * @param {Number} level スキルレベル
	 * @returns {String} スキルポイント消費マーク
	 */
	getPointMark: function(level) {
		// 消費ポイントマーカ
		var marktext = "";
		if (this.maxLevel === this.initialLevel) {
			// 初期取得スキルかつ最大レベル1の場合．基本攻撃
			// 何もしない
		} else {
			// 現在レベルに合わせて "_" か "X"を印字する
			var mark = SKILLPOINT_MARKED;
			if (level < 1) {
				// マーク切り替え
				mark = SKILLPOINT_MARK;
			}
			for (var i = 0; i < this.level1; i++) {
				marktext += mark;
			}
			if (level < 2) {
				// マーク切り替え
				mark = SKILLPOINT_MARK;
			}
			// レベル間隔
			marktext += " ";
			for (var i = 0; i < this.level2; i++) {
				marktext += mark;
			}
			// レベル間隔
			marktext += " ";
			if (level < 3) {
				// マーク切り替え
				mark = SKILLPOINT_MARK;
			}
			for (var i = 0; i < this.level3; i++) {
				marktext += mark;
			}
		}
		return marktext;
	},
	/**
	 * スキルレベルを変更する
	 * @param {Number} level
	 * @returns {undefined}
	 */
	changeLevel: function(level) {
		if (level === void(0)) {
			// levelが未定義の場合，初期化する
			level = this.initialLevel;
		} else {
			// レベル範囲検査
			if (level > this.maxLevel)
				level = this.maxLevel;
			else if (level < 1)
				level = this.initialLevel;
		}
		// レベル変更
		this.level = level;
		$("td#" + this.id).find("select").val(level);
		// スキルポイント消費マーク
		var pointmark = this.getPointMark(this.level);
		$("td#" + this.id).find(".mark").text(pointmark);
		// スキルレベルに基づく背景設定
		if (this.level === 0) {
			$("td#" + this.id).addClass("level0");
		} else {
			$("td#" + this.id).removeClass("level0");
		}

		// スキルレベルに基づいて，上位スキルを解放する
		if (this.level !== this.maxLevel) {
			var advSkills = this.upper.split(",");
			for (var i = 0; i < advSkills.length; i++) {
				if (advSkills[i] !== "") {
					skills[advSkills[i]].changeLevel(0);
				}
			}
		}
		// スキルレベルに基づいて，下位スキルを修得する
		if (this.level > 0) {
			var preSkills = this.lower.split(",");
			for (var i = 0; i < preSkills.length; i++) {
				if (preSkills[i] !== "") {
					skills[preSkills[i]].changeLevel(skills[preSkills[i]].maxLevel);
				}
			}
		}

		// レベルポイントガイド
		var spent = tspoint.get();
		$("#tspointmarkbox>span.mark").html(tspoint.getMark(spent));
		$("input#levelpoint").val(tspoint.getText(spent));
	}
};
$(document).ready(function() {
	// ツールチップ設定
	$("span.skillname").powerTip({placement: "n", smartPlacement: true});

	// スキルアイコンドラッグ
	$(".skillicon").draggable({helper: "clone"});

	// スキルアイコンダブルクリックでスロット登録
	$(".skillicon").dblclick(function() {
		var imgalt = $(this).attr("alt");
		// セット済みならば，スロット解除
		var icon = $("li.skillslot").find("img[alt=" + imgalt + "]");
		if (icon.length > 0) {
			icon.remove();
			return;
		}
		// 未セットなら，空きスロットに登録する
		for (var i = 0; i < SKILLSLOT_SIZE; i++) {
			if (void(0) === $($(".skillslot")[i]).children()[0]) {
				setSlot(i, imgalt);
				break;
			}
		}
	});

	// スキルアイコンドロップ
	$(".skillslot").droppable({
		tolerance: "pointer",
		drop: function(event, ui) {
			setSlot($(this).index(), $(ui.draggable.context).attr("alt"));
		}
	});

	/**
	 * スキルレベル上昇
	 */
	$("input.upLevel").click(function() {
		// スキルid
		var id = $(this).parents("td").attr("id");
		// インクリメント
		skills[id].changeLevel(skills[id].level + 1);
	});
	/**
	 * スキルレベル低下
	 */
	$("input.downLevel").click(function() {
		// スキルid
		var id = $(this).parents("td").attr("id");
		// デクリメント
		skills[id].changeLevel(skills[id].level - 1);
	});
	/**
	 * スキルレベル変更
	 */
	$("select").change(function() {
		// スキルIDを上位td要素のid属性から取得する
		var id = $(this).parents("td").attr("id");
		skills[id].changeLevel(parseInt(this.value));
	});
	/**
	 * リセットボタン
	 * 初期化する
	 */
	$("input#reset").click(function() {
		// スキルレベルを初期値にする
		for (var id in skills) {
			skills[id].changeLevel();
		}
		// スキルスロットを空にする
		$("li.skillslot").find("img").remove();
	});


	/**
	 * ダイアログ設定
	 */
	$("div.skilllist").dialog({title: "保存アドレスと取得スキルリスト",
		autoOpen: false, minWidth: 500});

	/**
	 * 保存アドレスとスキルリストダイアログクローズ
	 */
	$("input#closelist").click(function() {
		$("div.skilllist").dialog("close");
	});

	/**
	 * 保存アドレスとスキルリストダイアログオープン
	 */
	$("input#openlist").click(function() {
		var text = $("input#levelpoint").val();
		// 改行数
		var cr = 1;
		for (var id in skills) {
			if (skills[id].level > 0) {
				// 取得スキルを探して追記する
				text += "\n-" + skills[id].name + " Lv." + skills[id].level;
				cr++;
			}
		}

		// 保存アドレス
		var address = getSlotcode();
		// スキルスロット情報の有無で分岐
		if (address === "") {
			address = location.href.split("?")[0] + "?l=" + getLevelcode();
		} else {
			address = location.href.split("?")[0] + "?l=" + getLevelcode()
							+ "&s=" + address;
		}

		// 各情報を書き込み，ダイアログを開く
		$("div.skilllist").find($("input#storeaddress")).val(address);
		$("div.skilllist textarea").attr("rows", cr).val(text);
		$("div.skilllist").dialog("open");
	});

});
/**
 * 総合スキルポイント
 * @returns {TotalSkillPoint}
 */
function TotalSkillPoint() {
}

TotalSkillPoint.prototype = {
	/**
	 * 消費したスキルポイント
	 * @returns {Number}
	 */
	get: function() {
		var totalspent = 0;
		for (var id in skills) {
			// level0なら消費スキルポイントなし．次へ
			if (skills[id].level === 0) {
				continue;
			}

			switch (skills[id].level) {
				// fall through
				case 3:
					totalspent += skills[id].level3;
				case 2:
					totalspent += skills[id].level2;
				case 1:
					totalspent += skills[id].level1;
			}
		}
		return totalspent;
	},
	/**
	 * 消費スキルポイントマーク
	 * @param {Number} point 消費したスキルポイント
	 * @returns {String}
	 */
	getMark: function(point) {
		var mark = "";
		if (point === void(0))
			point = this.get();
		var i;
		if (point > SKILLPOINT_LIMIT)
		{
			// 消費スキルポイントが取得上限より大きい場合
			for (i = 0; i < SKILLPOINT_LIMIT; i++) {
				mark += SKILLPOINT_MARKED;
			}
			mark += '<span class="overlimit">';
			for (; i < point; i++) {
				mark += SKILLPOINT_MARKED;
			}
			mark += "</span>";
		} else {
			// 消費スキルポイントが取得上限以内の場合
			for (i = 0; i < point; i++) {
				mark += SKILLPOINT_MARKED;
			}
			for (; i < 45; i++) {
				mark += SKILLPOINT_MARK;
			}
		}
		return mark;
	},
	/**
	 * レベルポイントガイドテキスト
	 * Lv. -- rest 45 Max. 45
	 * @param {type} point 消費したスキルポイント
	 * @returns {String}
	 */
	getText: function(point) {
		if (point === void(0))
			point = this.get();
		// 残りポイント
		var rest = SKILLPOINT_LIMIT - point;
		var levelguide = "Lv.0";
		if (point > SKILLPOINT_LIMIT) {
			// 仕様外
			levelguide = "Lv.--";
			$("input#levelpoint").addClass("overlimit");
		} else if (point > 10) {
			// レベル40までは 1pt
			levelguide = "Lv." + (SKILLPOINT_LIMIT - rest - 5);
			$("input#levelpoint").removeClass("overlimit");
		} else if (point >= 0) {
			// レベル5までは 2pt
			levelguide = "Lv." + Math.ceil((SKILLPOINT_LIMIT - rest) / 2);
			$("input#levelpoint").removeClass("overlimit");
		}
		return levelguide + " 残SP:" + rest + " 最大SP:" + SKILLPOINT_LIMIT;
	}

};

/**
 * スキルスロットを埋める
 * @param {String} idcstring idc文字列
 * @returns {undefined}
 */
function resetSlot(idcstring) {
	// [0-9A-Za-z]でない値は 0 にする
	var code = idcstring.replace(/[^\w]/g, "0");
	// 短い値に合わせる
	var length = (code.length > SKILLSLOT_SIZE) ? SKILLSLOT_SIZE : code.length;
	for (var i = 0; i < length; i++) {
		if (code[i] === "0") {
			// スキップ
			continue;
		}
		for (var id in  skills) {
			// 一致するidcを検索する
			if (skills[id].idc === code[i]) {
				setSlot(i, skills[id].name + "アイコン");
			}
		}
	}
}

/**
 * スキルスロットにスキルアイコンをセットする
 * @param {Number} i スロット番号
 * @param {String} imgalt スキルアイコン代替テキスト
 * @returns {undefined}
 */
function setSlot(i, imgalt) {
	// 登録済みなら何もしない
	if ($("li.skillslot").find("img[alt=" + imgalt + "]").length > 0)
		return;

	// アイコン探索
	var img = $("td, .skillicon").find("[alt=" + imgalt + "]:eq(0)");
	if (img.length > 0) {
		// アイコン発見時
		var icon = img.clone();
		// ダブルクリックすると自滅する
		icon.dblclick(function() {
			$(this).remove();
		});

		// アイコン入れ替え
		$("li.skillslot:eq(" + i + ")").find("img").remove();
		$("li.skillslot:eq(" + i + ")").append(icon);
	}
}

/**
 *  GETパラメータを配列にして返す
 *  http://qiita.com/Evolutor_web/items/c9b940f752883676b35d
 *  @return     パラメータのObject
 *
 */
var getUrlVars = function() {
	var vars = {};
	var param = location.search.substring(1).split('&');
	for (var i = 0; i < param.length; i++) {
		var keySearch = param[i].search(/=/);
		var key = '';
		if (keySearch != -1)
			key = param[i].slice(0, keySearch);
		var val = param[i].slice(param[i].indexOf('=', 0) + 1);
		if (key != '')
			vars[key] = decodeURI(val);
	}
	return vars;
}

/**
 * レベルをリセットする
 * @param {String} code スキルテーブル順のレベル情報
 * @returns {undefined}
 */
function resetLevel(code) {
	// コード外文字を"000"にする
	code = code.replace(LEVELS_UNCODE, "a");
	// 数字列にデコードする
	var levelcode = "";
	for (var i = 0; i < code.length; i++) {
		levelcode += LEVELS_DECODE[code[i]];
	}
	var i = 0;
	for (var id in skills) {
		var level = parseInt(levelcode[i]);
		if (isNaN(level)) {
			// levelcode文字列がスキル数より短い場合，undefinedがNaNに化ける
			break;
		}
		skills[id].changeLevel(parseInt(level));
		i++;
	}
}

/**
 * スキルアイコン画像パスからスキルIDを抽出する
 * @param {String} src skilliconのsrc属性値
 * @returns {String} skillid
 */
function getidfromskilliconsrc(src) {
	if (src === void(0))
		return void(0);
	// ファイル名部分を取り出し，拡張子部分を剥がす
	return (src.split("/")[2]).split(".")[0];
}

/**
 * スキルレベル文字列
 * @returns {String} levelcode
 */
function getLevelcode() {
	var levelcode = "";
	for (var id in skills) {
		// レベル数字列をつくる
		levelcode += String(skills[id].level);
	}
	var code = "";
	var COMPRESS_WIDTH = 3;
	var i = 0;
	for (; i < levelcode.length - COMPRESS_WIDTH; i += COMPRESS_WIDTH) {
		code += LEVELS_ENCODE[levelcode.substring(i, i + COMPRESS_WIDTH)];
	}
	// 終端は整形する．"00"を追加し，最初3字を取る
	var lastcode = (levelcode.substring(i, levelcode.length) + "00").substring(0, COMPRESS_WIDTH);
	code += LEVELS_ENCODE[lastcode];

	// "000"を意味する終端の連続するaを消す
	return code.replace(/a+$/, "");
}

/**
 * スキルスロットidc文字列
 * @returns {String} idc文字列
 */
function getSlotcode() {
	var slotcode = "";
	for (var i = 0; i < SKILLSLOT_SIZE; i++) {
		var id = getidfromskilliconsrc(
						$("li.skillslot:eq(" + i + ")").find("img").attr("src")
						);
		slotcode += (id === void(0)) ? "0" : skills[id].idc;
	}

	// 終端の連続する"0"を消す
	return slotcode.replace(/0+$/, "");
}
