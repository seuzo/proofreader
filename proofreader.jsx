/*
proofreader.jsx
(c)2008-2009 www.seuzo.jp
ライセンス：GNU GPLv3
InDesign内で文字校正をします。

2008-10-24	ver.0.1	とりあえず
2008-10-25	ver.0.2	ネットワークに繋がっていなかったとき、エラーで終了するようにした。最初に設定ダイアログを出して、指摘範囲を指定できるようにした。
2008-11-03	ver.0.3	公開バージョン	http://d.hatena.ne.jp/seuzo/20081024/1224814060
2009-06-01	ver.0.4	InDesign CS4対応版。表、セルを選択している時、表内のテキストを検査対象とした。	http://d.hatena.ne.jp/seuzo/20090602/1243915084
*/

#target "InDesign-6.0"

////////////////////////////////////////////設定
const YAHOO_DOMAIN = "jlp.yahooapis.jp";
const YAHOO_PATH = "/KouseiService/V1/kousei?";
//Yahoo!アプリケーションIDの取得
YAHOO_ID = "3JR5Sxaxg67yPBDrHg7M92_bIpPh5atNPH5s_Cc8zc5qNcaTnveOJa3WNDjCQw--";//ここにアプリケーションIDを直接入力すれば、ファイルを探さない。
const USER_AGENT = 'proofreader/0.4 (' + Folder.fs + '; ' + $.os + '; ' + $.locale + ')';//Yahoo!に問い合わせる時のUser-Agentヘッダ
const DISPLAY_DIALOG = true;//設定ダイアログを表示するかどうか


////////////////////////////////////////////エラー処理 
function myerror(mess) { 
  if (arguments.length > 0) { alert(mess); }
  exit();
}


////////////////ダイアログ
function show_dialog(){
	var my_dialog = app.dialogs.add({name:"日本語校正支援：proofreader", canCancel:true});
	with(my_dialog) {
		with(dialogColumns.add()) {
			// プロンプト
			staticTexts.add({staticLabel:"選択行の校正を実行して、注釈を添付します。"});
			with (borderPanels.add()) {
				with(dialogRows.add()){staticTexts.add({staticLabel:"▼レベル1 - 基本：表記の間違いや不適切な表現に関する指摘"});}
				with(dialogRows.add()){var check_01 = checkboxControls.add({staticLabel:"誤字・誤変換　　　　　例）人事異同→人事異動", checkedState:true});}
				with(dialogRows.add()){var check_02 = checkboxControls.add({staticLabel:"言葉の誤用　　　　　　例）煙に巻く→けむに巻く", checkedState:true});}
				with(dialogRows.add()){var check_03 = checkboxControls.add({staticLabel:"使用注意　　　　　　　例）外人墓地→外国人墓地", checkedState:true});}
				with(dialogRows.add()){var check_04 = checkboxControls.add({staticLabel:"不快語　　　　　　　　例）がんをつける→にらむ", checkedState:true});}
				with(dialogRows.add()){var check_05 = checkboxControls.add({staticLabel:"機種依存・拡張文字　　例）○付き数字、一部の旧字体など", checkedState:true});}
				with(dialogRows.add()){var check_06 = checkboxControls.add({staticLabel:"外国地名表記の間違い　例）モルジブ→モルディブ", checkedState:true});}
				with(dialogRows.add()){var check_07 = checkboxControls.add({staticLabel:"固有名詞表記の間違い　例）ヤフーブログ→Yahoo!ブログ", checkedState:true});}
				with(dialogRows.add()){var check_08 = checkboxControls.add({staticLabel:"人名表記の間違い　　　例）ベートーヴェン→ベートーベン", checkedState:true});}
				with(dialogRows.add()){var check_09 = checkboxControls.add({staticLabel:"ら抜き言葉　　　　　　例）食べれる→食べられる", checkedState:true});}
			}
			with (borderPanels.add()) {
				with(dialogRows.add()){staticTexts.add({staticLabel:"▼レベル2 - 難読：わかりやすい表記にするための指摘"});}
				with(dialogRows.add()){var check_10 = checkboxControls.add({staticLabel:"当て字　　　　　　　　例）出鱈目、振り仮名", checkedState:true});}
				with(dialogRows.add()){var check_11 = checkboxControls.add({staticLabel:"表外漢字あり　　　　　例）灯籠→灯●", checkedState:true});}
				with(dialogRows.add()){var check_12 = checkboxControls.add({staticLabel:"用字　　　　　　　　　例）曖昧→あいまい", checkedState:true});}
				with(dialogRows.add()){var check_13 = checkboxControls.add({staticLabel:"商標など用語言い換え　例）セロテープ→セロハンテープ", checkedState:true});}
			}
			with (borderPanels.add()) {
				with(dialogRows.add()){staticTexts.add({staticLabel:"▼レベル3 - 品質：文章をよりよくするための指摘"});}
				with(dialogRows.add()){var check_14 = checkboxControls.add({staticLabel:"二重否定　　　　　　　例）聞かなくはない", checkedState:true});}
				with(dialogRows.add()){var check_15 = checkboxControls.add({staticLabel:"助詞不足の可能性あり　例）学校行く", checkedState:true});}
				with(dialogRows.add()){var check_16 = checkboxControls.add({staticLabel:"冗長表現　　　　　　　例）ことができます", checkedState:true});}
				with(dialogRows.add()){var check_17 = checkboxControls.add({staticLabel:"略語　　　　　　　　　例）ADSL→非対称デジタル加入者線(ADSL)", checkedState:true});}
			}
			with (borderPanels.add()) {
				with(dialogRows.add()){staticTexts.add({staticLabel:"　　　　　　　　　　　(c)2008-2009 市川せうぞー　http://www.seuzo.jp/"});}
			}
		}
	}


	if (my_dialog.show() == true) {
		check_01 = check_01.checkedState;
		check_02 = check_02.checkedState;
		check_03 = check_03.checkedState;
		check_04 = check_04.checkedState;
		check_05 = check_05.checkedState;
		check_06 = check_06.checkedState;
		check_07 = check_07.checkedState;
		check_08 = check_08.checkedState;
		check_09 = check_09.checkedState;
		check_10 = check_10.checkedState;
		check_11 = check_11.checkedState;
		check_12 = check_12.checkedState;
		check_13 = check_13.checkedState;
		check_14 = check_14.checkedState;
		check_15 = check_15.checkedState;
		check_16 = check_16.checkedState;
		check_17 = check_17.checkedState;
		//正常にダイアログを片付ける
		my_dialog.destroy();
		return  [false, check_01, check_02, check_03, check_04, check_05, check_06, check_07, check_08, check_09, check_10, check_11, check_12, check_13, check_14, check_15, check_16, check_17];
	} else {
		// ユーザが「キャンセル」をクリックしたので、メモリからダイアログボックスを削除
		my_dialog.destroy();
		myerror();
	}
}

////////////////////////////////////////////yahooへのリクエストと返事
function get_yahoo_respons(post_str) {
	var post_str;
	var reply = "";//サーバーからの返事
	var conn = new Socket;
	if (conn.open ( YAHOO_DOMAIN + ':80', 'UTF-8' ) ) {
		conn.write ('GET ' + YAHOO_PATH +'appid=' + YAHOO_ID + NO_FILTER + '&sentence=' + post_str + " HTTP/1.0\n"
			+ 'Host: ' + YAHOO_DOMAIN + "\n"
			+ 'User-Agent: ' + USER_AGENT + "\n"
            + "\n");
		reply = conn.read(999999);
        conn.close();
	} else {
		myerror("インターネットに接続されていません。");
	}
	return reply;
}



////////////////////////////////////////////実行
//InDesignで選択しているもののチェック
if (app.documents.length == 0) {myerror("ドキュメントが開かれていません")}
var my_doc = app.activeDocument;
if (my_doc.selection.length == 0) {myerror("テキストを選択してください")}
var my_selection = my_doc.selection[0];
var my_class =my_selection.constructor.name;
my_class = "Text, TextColumn, Story, Paragraph, Line, Word, Character, TextStyleRange, Table, Cell".match(my_class);

if (my_class == null) {
	myerror("テキストを選択してください");
} else if ((my_class == "Table") || my_class == "Cell") {//表組みが選択されています
	var my_obj = my_doc.selection[0];
	if (my_class == "Table") {my_obj = my_obj.cells.itemByRange(0, -1);}//everyItem()だとerrorになる
	var my_paragraphs = my_obj.paragraphs;
} else {
	var my_paragraphs = my_selection.paragraphs;//選択している段落
}

//ダイアログ処理
NO_FILTER = "";//指摘除外フィルタ（指摘番号をコンマで区切って指定。詳細は、http://developer.yahoo.co.jp/jlp/KouseiService/V1/kousei.html）
if (DISPLAY_DIALOG) {
	var ans_dialog = show_dialog();
	var no_filter_count = 1;//除外数のカウント
	for (var i = 1; i < ans_dialog.length; i++) {//0番地はダミー
		if (ans_dialog[i] == false) {
			NO_FILTER += "," + i;//フィルタ番号を加算
			no_filter_count++;
		}
	}
	if (ans_dialog.length == no_filter_count) {myerror("ダイアログのすべてのチェックが外れています")}
	if (NO_FILTER != "") {NO_FILTER = NO_FILTER.replace (/^,/, '&no_filter=')}
}

//各段落の処理
var my_regex = new RegExp(/^[　\s\r\n]*$/);//空行をみつけるための正規表現
var my_counter = 0;//かうんたっく
for(var i = (my_paragraphs.length -1); i >= 0; i--) {//段落を後ろから処理
	var my_contents = my_paragraphs[i].contents;
	if (my_regex.test(my_contents)){continue;}//空行なら次の段落へ
	var post_str = encodeURI(my_contents);//エンコード
	var my_reply = get_yahoo_respons(post_str);//Yahooへの問い合わせ
	my_reply = my_reply.split("\n\n", 2)[1];//レスポンスヘッダの削除
	
	var my_xml = new XML(my_reply);//XMLオブジェクトの生成
	var my_ns_uri = my_xml.namespace();
	var my_ns = new Namespace(my_ns_uri);
	setDefaultXMLNamespace(my_ns);//デフォルトネームスペースを設定する
	if (my_xml.localName().toString() == "Error"){//エラー要素があったら中止
		myerror("サーバーがエラーを返しました：" + my_xml.xpath("/Error/Message")[0].toString());
	}
	for( var ii = (my_xml.Result.length() - 1); ii >= 0; ii--) {//my_xmlのエレメントを後ろから処理
		var my_StartPos = parseInt(my_xml.Result[ii].StartPos[0].toString());//スタートポイント、文字位置
		var my_Surface = "【誤】" + my_xml.Result[ii].Surface[0].toString() + "\n";
		var my_ShitekiWord = "【正】" + my_xml.Result[ii].ShitekiWord[0].toString() + "\n";
		var my_ShitekiInfo = "＜" + my_xml.Result[ii].ShitekiInfo[0].toString() + "＞\n";
		
		var my_note = my_paragraphs[i].insertionPoints[my_StartPos].notes.add();//注釈の作成
		my_note.texts[0].contents = my_ShitekiInfo + my_Surface + my_ShitekiWord;//注釈の中身を書き換え
		my_counter++;
	}
}
myerror("校正の結果：\n" + my_counter + "箇所の注釈をつけました");
