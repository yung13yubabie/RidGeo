# 本機 GPX 讀取與取消

本機目標與歷史檔共用每頁一個邏輯讀取名額，使用可取消的 FileReader，每次新建並在完成後移除引用。歷史仍可保留8筆、每檔5MiB及原有合計限制，按選取順序逐筆讀取。此維護不縮短合法路線、刪除點位或重建時間戳。

讀取後，以同一份未公開的原始位元組計算SHA及Base64，只傳回不可變字串與位元組數。選檔、取消、換來源及pagehide會取消所屬讀取；過期回應不能恢復路線、證據或匯出。忙碌拒絕在取得名額之前不清除其他既有結果，檔案選取值會清空以便重選同檔。

瀏覽器WebCrypto沒有取消digest的參數。取消會立即停止UI接收，但已開始的digest仍占用該名額，直到它真正完成；如果底層永不完成，需重新載入頁面，不能無限排入新工作。一般取消不表示原生記憶體立刻回收。每頁另有最多一筆未完成的路線庫digest；其他請求、來源指紋及runtime完整性hash不在這兩個名額的範圍。

官方直連下載保留固定來源、SHA、5MiB及預設30秒期限。fetch/read/digest會在取消或期限後拒絕，遲到body不會被使用；清理不等待可能失聯的cancel Promise。直連串流以固定至多5MiB buffer累積，不依chunk數建立無界物件清單。 每64個chunk（含空chunk）或256KiB會真正讓出一次event-loop task，讓已排入的取消／期限回呼有機會執行，再核對原有signal與期限；不因此拒絕合法的小chunk串流。受核實的same-origin bridge也以單一有界buffer累積，每64個chunk（含空chunk）或256KiB讓出一次task；成功檔仍要求核實的精確長度及SHA，錯誤回應仍限16KiB，409保持拒絕且不接受新版本。獨立client預設15秒、路線庫預設30秒均未改。這是每次呼叫的byte容器及排程界線，並非全頁／跨頁的總記憶體配額。

conditional runtime asset仍為原本至多1MiB串流讀取，可接受額外AbortSignal，取消與錯誤不等待body取消完成。現有Worker外層120秒總期限及終止機制沒有縮短；HTTP開發介面的取消不會終止伺服器CPU。

## 仍未完成的資源／安全邊界

- 兩處主執行緒DOMParser，以及含站GPX的同步序列化，仍可能使畫面暫停；普通DedicatedWorker沒有DOMParser，不能宣稱已隔離。
- 多筆／平台／conditional的大JSON前置與結果驗證有同步主執行緒階段，不受之後才啟動的Worker timer中斷。
- Python3.14.2／Expat2.7.3的已知底層問題仍需完整來源綁定的runtime修復。本批沒有修復CVE，也沒有完成攻擊免疫或總記憶體上限證明。
- FileReader/DOM的Node測試模型不等於真瀏覽器、手機、窄螢幕、觸控或焦點驗收。每頁名額不是跨分頁、跨程序或分散式配額。
- Intervals仍預設503；真帳號授權、正式持久狀態與host資源資格未接通。沒有手錶實機同步／相容性新承諾。

維護檢查：npm run check:gpx-acquisition及npm run check:strict-bridge-acquisition。Bundled WASM整合檢查另以node --experimental-vm-modules checks/gpx-acquisition/actual-app.mjs --native執行，僅在串行原生時段內；兩者的證據範圍須分列。
