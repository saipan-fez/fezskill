/**
 * 
 * @param {String} src skilliconのsrc属性値
 * @returns {String} skillid
 */
function getidfromskilliconsrc(src) {
	return (src.split("/")[2]).split(".")[0];
}

var TRUE_STRING = "TRUE";
var ICON_WIDTH = "32";
var SKILLPOINT_MARK = "-";
var SKILLPOINT_MARKED = "X";
var SKILLPOINT_LIMIT = 40;
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
//function makeSkillBox(id, name, level1, level2, level3, )

/**
 * TSVファイルのパース結果を持つクラス
 * @param {undefined} characterClass キャラクタクラス
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
	 * @returns {undefined}
	 */
	show: function() {
		if (typeof (this.data) === undefined) {
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
 * 
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
		if (level === undefined) {
			// levelが未定義の場合，初期化する
			level = this.initialLevel;
		} else {
			// レベル範囲検査
			if (level > this.maxLevel)
				level = this.maxLevel;
			else if (level < 0)
				level = 0;
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
$(function() {

	/**
	 * スキルレベル上昇
	 */
	$("input.upLevel").click(function() {
		// スキルid
		var skillid = $(this).parents("td").attr("id");
		// インクリメント
		skills[skillid].changeLevel(skills[skillid].level + 1);
	});
	/**
	 * スキルレベル低下
	 */
	$("input.downLevel").click(function() {
		// スキルid
		var skillid = $(this).parents("td").attr("id");
		// デクリメント
		skills[skillid].changeLevel(skills[skillid].level - 1);
	});
	/**
	 * スキルレベル変更
	 */
	$("select").change(function() {
		// スキルIDを上位td要素のid属性から取得する
		var skillid = $(this).parents("td").attr("id");
		skills[skillid].changeLevel(parseInt(this.value));
	});
	/**
	 * リセットボタン
	 * 初期化する
	 */
	$("input#reset").click(function() {
		for (var i in skills) {
			skills[i].changeLevel();
		}
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
		for (var i in skills) {
			// level0なら消費スキルポイントなし．次へ
			if (skills[i].level === 0) {
				continue;
			}

			switch (skills[i].level) {
				// fall through
				case 3:
					totalspent += skills[i].level3;
				case 2:
					totalspent += skills[i].level2;
				case 1:
					totalspent += skills[i].level1;
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
		if (point === undefined)
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
			for (; i < 40; i++) {
				mark += SKILLPOINT_MARK;
			}
		}
		return mark;
	},
	/**
	 * レベルポイントガイドテキスト
	 * Lv. -- rest 40 Max. 40
	 * @param {type} point 消費したスキルポイント
	 * @returns {String}
	 */
	getText: function(point) {
		if (point === undefined)
			point = this.get();
		// 残りポイント
		var rest = SKILLPOINT_LIMIT - point;
		var levelguide = "Lv. 0";
		if (point > SKILLPOINT_LIMIT) {
			// 仕様外
			levelguide = "Lv. --";
			$("input#levelpoint").addClass("overlimit");
		} else if (point > 10) {
			// レベル35までは 1pt
			levelguide = "Lv. " + (SKILLPOINT_LIMIT - rest - 5);
			$("input#levelpoint").removeClass("overlimit");
		} else if (point > 0) {
			// レベル5までは 2pt
			levelguide = "Lv. " + Math.ceil((SKILLPOINT_LIMIT - rest) / 2);
			$("input#levelpoint").removeClass("overlimit");
		}
		return levelguide + " rest " + rest + " Max. " + SKILLPOINT_LIMIT;
	}

};

/**
 * 
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
		for (var j in  skills) {
			// 一致するidcを検索する
			if (skills[j].idc === code[i]) {
				setslot(i, skills.name + "アイコン");
			}
		}
	}
}

/**
 * スキルスロットにスキルアイコンをセットする
 * @param {Number} i slot番号
 * @param {String} imgalt スキルアイコン代替テキスト
 * @returns {undefined}
 */
function setSlot(i, imgalt) {
	// アイコン探索
	var img = $("td, .skillicon").find("[alt=" + imgalt + "]");
	if (img.length === 1) {
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
