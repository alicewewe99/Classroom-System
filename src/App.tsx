import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Volume2,
  VolumeX,
  Share2,
  RotateCcw,
  Sparkles,
  School,
  Bus,
  UtensilsCrossed,
  FileEdit,
  Smartphone,
  X
} from 'lucide-react';
import { soundManager } from './utils/audio';
import { drawMarioLeaveCard, LeaveData } from './utils/canvasCard';

interface AttendanceRow {
  id: string;
  name: string;
  status: string;
}

interface BusRow {
  id: string;
  name: string;
  status: string;
}

interface MealRow {
  id: string;
  name: string;
  type: string;
  custom: string;
}

interface NoteRow {
  id: string;
  name: string;
  reason: string;
}

const CHIPMUNK_ICON_URL = '/chipmunk_icon.jpg';

export default function App() {
  // 日期與基本資訊
  const [datePickerValue, setDatePickerValue] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [caseName, setCaseName] = useState<string>('');

  // 列表狀態
  const [attendanceList, setAttendanceList] = useState<AttendanceRow[]>([
    { id: 'att-1', name: '', status: '整天休息' }
  ]);
  const [busList, setBusList] = useState<BusRow[]>([
    { id: 'bus-1', name: '', status: '整天不用載' }
  ]);
  const [mealList, setMealList] = useState<MealRow[]>([
    { id: 'meal-1', name: '', type: '吃稀飯', custom: '' }
  ]);
  const [notesList, setNotesList] = useState<NoteRow[]>([
    { id: 'note-1', name: '', reason: '' }
  ]);

  // 結果呈現
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copiedTextToast, setCopiedTextToast] = useState<boolean>(false);
  const [copiedImgToast, setCopiedImgToast] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  // 遊戲元素狀態
  const [coins, setCoins] = useState<number>(10);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Mascot 圖片預載
  const mascotImgRef = useRef<HTMLImageElement | null>(null);

  // Canvas 參照
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textPreviewRef = useRef<HTMLDivElement | null>(null);
  const imagePreviewRef = useRef<HTMLDivElement | null>(null);

  // 初始化：預設今日日期、預載花栗鼠 Icon
  useEffect(() => {
    soundManager.initMuteState();
    setIsMuted(soundManager.getMuted());

    // 預載花栗鼠圖像供 Canvas 繪製使用
    const img = new Image();
    img.src = CHIPMUNK_ICON_URL;
    img.onload = () => {
      mascotImgRef.current = img;
    };

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const initDate = `${yyyy}-${mm}-${dd}`;
    setDatePickerValue(initDate);
    updateFormattedDate(initDate);

    // 載入草稿
    try {
      const savedDraft = localStorage.getItem('mario_leave_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.caseName) setCaseName(parsed.caseName);
        if (parsed.attendanceList && parsed.attendanceList.length > 0) {
          setAttendanceList(parsed.attendanceList);
        }
        if (parsed.busList && parsed.busList.length > 0) {
          setBusList(parsed.busList);
        }
        if (parsed.mealList && parsed.mealList.length > 0) {
          setMealList(parsed.mealList);
        }
        if (parsed.notesList && parsed.notesList.length > 0) {
          setNotesList(parsed.notesList);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 自動存檔草稿
  useEffect(() => {
    try {
      const draft = {
        caseName,
        attendanceList,
        busList,
        mealList,
        notesList
      };
      localStorage.setItem('mario_leave_draft', JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [caseName, attendanceList, busList, mealList, notesList]);

  // 日期格式化：產生「X月X日 (星期X)」
  const updateFormattedDate = (dateStr: string) => {
    if (!dateStr) {
      setFormattedDate('');
      return;
    }
    const parts = dateStr.split('-');
    if (parts.length < 3) return;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const dayName = days[d.getDay()];
    setFormattedDate(`${month}月${date}日 (${dayName})`);
  };

  const handleDateChange = (val: string) => {
    setDatePickerValue(val);
    updateFormattedDate(val);
    soundManager.playBlip();
  };

  const setRelativeDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const val = `${yyyy}-${mm}-${dd}`;
    setDatePickerValue(val);
    updateFormattedDate(val);
    soundManager.playCoin();
  };

  const setNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    setRelativeDate(diff);
  };

  // 音效開關切換
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
    if (!next) {
      soundManager.playCoin();
    }
  };

  // 1. 出席名單管理
  const addAttendanceRow = (name = '', status = '整天休息') => {
    setAttendanceList(prev => [
      ...prev,
      { id: `att-${Date.now()}-${Math.random()}`, name, status }
    ]);
    soundManager.playJump();
  };

  const updateAttendanceRow = (id: string, updates: Partial<AttendanceRow>) => {
    setAttendanceList(prev =>
      prev.map(row => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const deleteAttendanceRow = (id: string) => {
    setAttendanceList(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : [{ id: 'att-1', name: '', status: '整天休息' }]));
    soundManager.playBlip();
  };

  const batchSetAttendance = (status: string) => {
    setAttendanceList(prev => prev.map(r => ({ ...r, status })));
    soundManager.playCoin();
    setCoins(c => c + 1);
  };

  // 2. 交通車管理
  const addBusRow = (name = '', status = '整天不用載') => {
    setBusList(prev => [
      ...prev,
      { id: `bus-${Date.now()}-${Math.random()}`, name, status }
    ]);
    soundManager.playJump();
  };

  const updateBusRow = (id: string, updates: Partial<BusRow>) => {
    setBusList(prev =>
      prev.map(row => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const deleteBusRow = (id: string) => {
    setBusList(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : [{ id: 'bus-1', name: '', status: '整天不用載' }]));
    soundManager.playBlip();
  };

  const batchSetBus = (status: string) => {
    setBusList(prev => prev.map(r => ({ ...r, status })));
    soundManager.playCoin();
    setCoins(c => c + 1);
  };

  // 3. 伙食管理
  const addMealRow = (name = '', type = '吃稀飯', custom = '') => {
    setMealList(prev => [
      ...prev,
      { id: `meal-${Date.now()}-${Math.random()}`, name, type, custom }
    ]);
    soundManager.playJump();
  };

  const updateMealRow = (id: string, updates: Partial<MealRow>) => {
    setMealList(prev =>
      prev.map(row => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const deleteMealRow = (id: string) => {
    setMealList(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : [{ id: 'meal-1', name: '', type: '吃稀飯', custom: '' }]));
    soundManager.playBlip();
  };

  // 4. 備註管理
  const addNoteRow = (name = '', reason = '') => {
    setNotesList(prev => [
      ...prev,
      { id: `note-${Date.now()}-${Math.random()}`, name, reason }
    ]);
    soundManager.playJump();
  };

  const updateNoteRow = (id: string, updates: Partial<NoteRow>) => {
    setNotesList(prev =>
      prev.map(row => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const deleteNoteRow = (id: string) => {
    setNotesList(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : [{ id: 'note-1', name: '', reason: '' }]));
    soundManager.playBlip();
  };

  // 一鍵同步出席名單至交通車與伙食
  const syncNamesFromAttendance = (target: 'bus' | 'meal') => {
    const validNames = attendanceList.map(a => a.name.trim()).filter(Boolean);
    if (validNames.length === 0) {
      alert('請先在出席區填寫長輩姓名唷！🍄');
      return;
    }

    if (target === 'bus') {
      const newBusList = validNames.map((name, i) => ({
        id: `bus-sync-${Date.now()}-${i}`,
        name,
        status: '整天不用載'
      }));
      setBusList(newBusList);
    } else {
      const newMealList = validNames.map((name, i) => ({
        id: `meal-sync-${Date.now()}-${i}`,
        name,
        type: '吃稀飯',
        custom: ''
      }));
      setMealList(newMealList);
    }
    soundManager.playPowerUp();
    setCoins(c => c + 3);
  };

  // 重設全部資料
  const handleReset = () => {
    if (window.confirm('確定要清空目前填寫的內容重新開始嗎？')) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const initDate = `${yyyy}-${mm}-${dd}`;
      setDatePickerValue(initDate);
      updateFormattedDate(initDate);
      setCaseName('');
      setAttendanceList([{ id: 'att-1', name: '', status: '整天休息' }]);
      setBusList([{ id: 'bus-1', name: '', status: '整天不用載' }]);
      setMealList([{ id: 'meal-1', name: '', type: '吃稀飯', custom: '' }]);
      setNotesList([{ id: 'note-1', name: '', reason: '' }]);
      setGeneratedText('');
      setImagePreviewUrl('');
      soundManager.playJump();
    }
  };

  // 快速常用範本套用
  const applyPresetTemplate = (type: 'clinic' | 'vaccine' | 'typhoon') => {
    soundManager.playPowerUp();
    setCoins(c => c + 2);
    if (type === 'clinic') {
      setNotesList([
        { id: `note-${Date.now()}`, name: '', reason: '醫院定期回診就醫，請假一天' }
      ]);
    } else if (type === 'vaccine') {
      setNotesList([
        { id: `note-${Date.now()}`, name: '', reason: '施打流感/新冠疫苗，在家休息觀察' }
      ]);
    } else if (type === 'typhoon') {
      setNotesList([
        { id: `note-${Date.now()}`, name: '', reason: '天候因素/停班停課，全體休息接送暫停' }
      ]);
    }
  };

  // 收集有效資料
  const getPayloadData = (): LeaveData => {
    const validAtt = attendanceList
      .filter(a => a.name.trim() !== '')
      .map(a => ({ id: a.id, name: a.name.trim(), status: a.status }));

    const validBus = busList
      .filter(b => b.name.trim() !== '')
      .map(b => ({ id: b.id, name: b.name.trim(), status: b.status }));

    const validMeal = mealList
      .filter(m => m.name.trim() !== '')
      .map(m => {
        let finalStatus = m.type;
        if (m.type === '自訂') {
          finalStatus = m.custom.trim() || '自訂需求';
        }
        return { id: m.id, name: m.name.trim(), status: finalStatus };
      });

    const validNotes = notesList
      .filter(n => n.name.trim() !== '' || n.reason.trim() !== '')
      .map(n => ({ id: n.id, name: n.name.trim(), reason: n.reason.trim() }));

    return {
      date: formattedDate,
      caseName: caseName.trim(),
      attendance: validAtt,
      bus: validBus,
      meal: validMeal,
      notes: validNotes
    };
  };

  // 5. 產生格式化文字並自動複製
  const handleGenerateText = () => {
    const data = getPayloadData();
    let text = `【長輩請假通知 🍄 ✨ 🌟】\n\n`;

    if (data.date) {
      text += `📅 日期：${data.date}\n`;
    }
    if (data.caseName) {
      text += `👤 個案：${data.caseName}\n`;
    }
    if (data.date || data.caseName) {
      text += `\n`;
    }

    if (data.attendance.length > 0) {
      text += `🏫 出席：\n`;
      data.attendance.forEach(item => {
        text += `${item.name} - ${item.status}\n`;
      });
      text += `\n`;
    }

    if (data.bus.length > 0) {
      text += `🚐 交通車：\n`;
      data.bus.forEach(item => {
        text += `${item.name} - ${item.status}\n`;
      });
      text += `\n`;
    }

    if (data.meal.length > 0) {
      text += `🍱 伙食：\n`;
      data.meal.forEach(item => {
        text += `${item.name} - ${item.status}\n`;
      });
      text += `\n`;
    }

    if (data.notes.length > 0) {
      text += `📌 備註：\n`;
      data.notes.forEach(item => {
        text += `${item.name ? item.name + '：' : ''}${item.reason}\n`;
      });
    }

    const trimmed = text.trim();
    setGeneratedText(trimmed);

    copyTextToClipboard(trimmed);
    soundManager.playCoin();
    setCoins(c => c + 1);

    setTimeout(() => {
      textPreviewRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const copyTextToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedTextToast(true);
        setTimeout(() => setCopiedTextToast(false), 3000);
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      setCopiedTextToast(true);
      setTimeout(() => setCopiedTextToast(false), 3000);
    } catch {
      // ignore
    }
    document.body.removeChild(el);
  };

  // 6. 產生瑪利歐圖卡 (包含可愛花栗鼠拿蘑菇吉祥物)
  const handleGenerateImage = () => {
    if (!canvasRef.current) return;
    const data = getPayloadData();
    const dataUrl = drawMarioLeaveCard(canvasRef.current, data, 2, mascotImgRef.current);
    setImagePreviewUrl(dataUrl);
    soundManager.playPowerUp();
    setCoins(c => c + 5);

    setTimeout(() => {
      imagePreviewRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 下載圖卡
  const downloadImage = () => {
    if (!imagePreviewUrl) return;
    const a = document.createElement('a');
    a.href = imagePreviewUrl;
    const safeDate = datePickerValue.replace(/-/g, '');
    a.download = `長輩請假通知_${safeDate || 'Mario'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundManager.playCoin();
  };

  // 下載花栗鼠桌面圖示本體
  const downloadChipmunkIcon = () => {
    const a = document.createElement('a');
    a.href = CHIPMUNK_ICON_URL;
    a.download = `花栗鼠拿蘑菇_桌面icon.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundManager.playCoin();
  };

  // 複製圖片到剪貼簿
  const copyImageToClipboard = async () => {
    if (!canvasRef.current) return;
    soundManager.playBlip();
    try {
      canvasRef.current.toBlob(async blob => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedImgToast(true);
          soundManager.playCoin();
          setTimeout(() => setCopiedImgToast(false), 3000);
        } else {
          alert('請長按預覽圖或點擊「下載圖卡」儲存分享！');
        }
      });
    } catch {
      alert('您的瀏覽器不支援直接複製圖片，請點擊「下載圖卡」儲存分享！');
    }
  };

  // 分享到 LINE
  const shareToLine = () => {
    if (!generatedText) {
      handleGenerateText();
    }
    const content = generatedText || '長輩請假通知';
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(content)}`;
    window.open(lineUrl, '_blank');
    soundManager.playCoin();
  };

  return (
    <div className="min-h-screen pb-16">
      {/* 隱藏的 Canvas 渲染畫布 (2x 解析度輸出) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 頂部瑪利歐遊戲風格標頭 */}
      <header className="bg-red-600 border-b-8 border-black py-4 px-4 text-white relative shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* 左側：可愛卡通花栗鼠拿著蘑菇桌面 Icon + 標題 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.playCoin();
                setCoins(c => c + 1);
                setShowInstallModal(true);
              }}
              title="點擊查看花栗鼠桌面 Icon 與加入主畫面教學"
              className="relative group cursor-pointer focus:outline-none"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-3 border-black shadow-[3px_3px_0_#000] bg-yellow-300 transition-transform group-hover:scale-105 active:scale-95">
                <img
                  src={CHIPMUNK_ICON_URL}
                  alt="可愛花栗鼠拿蘑菇桌面 Icon"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 金幣冒出小徽章 */}
              <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full border border-black shadow-[1px_1px_0_#000]">
                ICON
              </span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-wider text-yellow-300 drop-shadow-[0_3px_0_#000]">
                  長輩請假通知 🌟
                </h1>
                <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-md font-black border border-black shadow-[1px_1px_0_#000]">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-red-100 font-medium">Super Mario Mushroom Adventure</p>
                <button
                  onClick={() => setShowInstallModal(true)}
                  className="text-[11px] underline text-yellow-200 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Smartphone className="w-3 h-3" />
                  加到桌面捷徑
                </button>
              </div>
            </div>
          </div>

          {/* 右側：遊戲數值計分看板與音效按鈕 */}
          <div className="flex items-center gap-3">
            <div className="bg-black/80 border-2 border-yellow-400 rounded-lg px-3 py-1 flex items-center gap-4 text-xs mario-font text-white">
              <span className="text-yellow-300">STAGE 1-1</span>
              <span className="text-yellow-400 flex items-center gap-1">
                🪙 x {coins}
              </span>
            </div>

            <button
              onClick={toggleMute}
              title={isMuted ? '開啟 8-bit 音效' : '關閉音效'}
              className="p-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg border-2 border-black shadow-[2px_2px_0_#000] font-bold transition-all active:translate-y-0.5"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 主內容區塊 */}
      <main className="max-w-4xl mx-auto mt-6 px-4">
        
        {/* 快速範本與捷徑列 */}
        <div className="bg-white/95 rounded-xl p-3 mb-6 border-3 border-black shadow-[3px_3px_0_#000] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>快速套用範本：</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPresetTemplate('clinic')}
              className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md border border-black transition-colors"
            >
              🏥 定期回診
            </button>
            <button
              onClick={() => applyPresetTemplate('vaccine')}
              className="text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-900 px-2.5 py-1 rounded-md border border-black transition-colors"
            >
              💉 疫苗接種
            </button>
            <button
              onClick={() => applyPresetTemplate('typhoon')}
              className="text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 px-2.5 py-1 rounded-md border border-black transition-colors"
            >
              🌀 天候停課
            </button>
            <button
              onClick={handleReset}
              className="text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 px-2.5 py-1 rounded-md border border-black flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              清空重填
            </button>
          </div>
        </div>

        {/* 1. 基本資訊區 */}
        <section className="bg-white rounded-2xl p-6 mb-6 pixel-box">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-red-600 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-red-500" />
              <span>基本資訊與日期</span>
            </h2>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-300">
              步驟 1/4
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 請假日期 */}
            <div>
              <label className="block font-bold mb-1.5 text-gray-800 text-sm">
                📅 請假日期 (可選取日曆)：
              </label>
              <input
                type="date"
                value={datePickerValue}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full border-3 border-black rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-yellow-50 cursor-pointer shadow-[2px_2px_0_#000]"
              />
              
              {/* 日期快捷鍵 */}
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setRelativeDate(0)}
                  className="text-xs font-bold bg-gray-100 hover:bg-yellow-200 border border-black px-2 py-0.5 rounded transition-colors"
                >
                  今天
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeDate(1)}
                  className="text-xs font-bold bg-gray-100 hover:bg-yellow-200 border border-black px-2 py-0.5 rounded transition-colors"
                >
                  明天
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeDate(2)}
                  className="text-xs font-bold bg-gray-100 hover:bg-yellow-200 border border-black px-2 py-0.5 rounded transition-colors"
                >
                  後天
                </button>
                <button
                  type="button"
                  onClick={setNextMonday}
                  className="text-xs font-bold bg-gray-100 hover:bg-yellow-200 border border-black px-2 py-0.5 rounded transition-colors"
                >
                  下週一
                </button>
              </div>

              {formattedDate && (
                <div className="mt-2 text-sm font-black text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-200">
                  <span>✨ 呈現格式：</span>
                  <span className="text-base text-red-700">{formattedDate}</span>
                </div>
              )}
            </div>

            {/* 個案名稱 */}
            <div>
              <label className="block font-bold mb-1.5 text-gray-800 text-sm">
                👤 個案對象 (選填)：
              </label>
              <input
                type="text"
                value={caseName}
                onChange={e => setCaseName(e.target.value)}
                placeholder="例如：王小明 阿公、陳大姐 (選填)"
                className="w-full border-3 border-black rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-[2px_2px_0_#000]"
              />
              {/* 長輩稱謂快捷點擊 */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-xs text-gray-500 font-bold">快速稱謂：</span>
                {['阿公', '阿嬤', '伯伯', '大姐', '媽媽', '爸爸'].map(title => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      setCaseName(prev => (prev ? `${prev} ${title}` : title));
                      soundManager.playBlip();
                    }}
                    className="text-xs font-bold bg-amber-50 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded transition-colors"
                  >
                    +{title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. 出席狀態區 */}
        <section className="bg-amber-100/95 rounded-2xl p-6 mb-6 pixel-card-yellow">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-extrabold text-amber-900 flex items-center gap-2">
              <School className="w-6 h-6 text-amber-700" />
              <span>1. 出席狀態</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => batchSetAttendance('上午上課')}
                className="pixel-btn pixel-btn-yellow text-xs px-2.5 py-1.5 rounded-lg"
              >
                全選：上午上課
              </button>
              <button
                onClick={() => batchSetAttendance('下午上課')}
                className="pixel-btn pixel-btn-yellow text-xs px-2.5 py-1.5 rounded-lg"
              >
                全選：下午上課
              </button>
              <button
                onClick={() => batchSetAttendance('整天休息')}
                className="pixel-btn pixel-btn-red text-xs px-2.5 py-1.5 rounded-lg"
              >
                全選：整天休息
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {attendanceList.map((row) => (
              <div
                key={row.id}
                className="bg-white p-3 rounded-xl border-2 border-black flex flex-wrap items-center gap-2 shadow-sm"
              >
                <input
                  type="text"
                  placeholder="長輩姓名 (選填)"
                  value={row.name}
                  onChange={e => updateAttendanceRow(row.id, { name: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg flex-1 min-w-[140px] font-bold focus:border-amber-500 focus:outline-none"
                />
                <select
                  value={row.status}
                  onChange={e => updateAttendanceRow(row.id, { status: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg font-bold bg-amber-50 focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="上午上課">上午上課</option>
                  <option value="下午上課">下午上課</option>
                  <option value="整天休息">整天休息</option>
                </select>
                <button
                  onClick={() => deleteAttendanceRow(row.id)}
                  title="刪除此列"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded-lg border border-black transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addAttendanceRow()}
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>新增出席名單</span>
          </button>
        </section>

        {/* 3. 交通車接送區 */}
        <section className="bg-blue-100/95 rounded-2xl p-6 mb-6 pixel-card-blue">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-blue-900 flex items-center gap-2">
                <Bus className="w-6 h-6 text-blue-700" />
                <span>2. 交通車接送</span>
              </h2>
              <button
                onClick={() => syncNamesFromAttendance('bus')}
                className="text-xs bg-white text-blue-700 font-bold px-2 py-1 rounded border border-blue-400 shadow-sm hover:bg-blue-50 transition-colors"
                title="自動帶入上方出席名單"
              >
                ⚡ 同步出席名單
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => batchSetBus('早上不用載')}
                className="pixel-btn pixel-btn-blue text-xs px-2.5 py-1.5 rounded-lg"
              >
                全選：早上不用載
              </button>
              <button
                onClick={() => batchSetBus('下午不用載')}
                className="pixel-btn pixel-btn-blue text-xs px-2.5 py-1.5 rounded-lg"
              >
                全選：下午不用載
              </button>
              <button
                onClick={() => batchSetBus('整天不用載')}
                className="pixel-btn pixel-btn-red text-xs px-2.5 py-1.5 rounded-lg"
              >
                全選：整天不用載
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {busList.map((row) => (
              <div
                key={row.id}
                className="bg-white p-3 rounded-xl border-2 border-black flex flex-wrap items-center gap-2 shadow-sm"
              >
                <input
                  type="text"
                  placeholder="長輩姓名 (選填)"
                  value={row.name}
                  onChange={e => updateBusRow(row.id, { name: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg flex-1 min-w-[140px] font-bold focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={row.status}
                  onChange={e => updateBusRow(row.id, { status: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg font-bold bg-blue-50 focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="早上不用載">早上不用載</option>
                  <option value="下午不用載">下午不用載</option>
                  <option value="整天不用載">整天不用載</option>
                  <option value="自行到校/家屬接送">自行到校/家屬接送</option>
                </select>
                <button
                  onClick={() => deleteBusRow(row.id)}
                  title="刪除此列"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded-lg border border-black transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addBusRow()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>新增交通車名單</span>
          </button>
        </section>

        {/* 4. 伙食安排區 */}
        <section className="bg-emerald-100/95 rounded-2xl p-6 mb-6 pixel-card-green">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-emerald-900 flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-emerald-700" />
                <span>3. 伙食需求</span>
              </h2>
              <button
                onClick={() => syncNamesFromAttendance('meal')}
                className="text-xs bg-white text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-400 shadow-sm hover:bg-emerald-50 transition-colors"
                title="自動帶入上方出席名單"
              >
                ⚡ 同步出席名單
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {mealList.map((row) => (
              <div
                key={row.id}
                className="bg-white p-3 rounded-xl border-2 border-black flex flex-wrap items-center gap-2 shadow-sm"
              >
                <input
                  type="text"
                  placeholder="長輩姓名 (選填)"
                  value={row.name}
                  onChange={e => updateMealRow(row.id, { name: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg flex-1 min-w-[120px] font-bold focus:border-emerald-500 focus:outline-none"
                />
                <select
                  value={row.type}
                  onChange={e => updateMealRow(row.id, { type: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg font-bold bg-emerald-50 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="吃稀飯">吃稀飯</option>
                  <option value="吃乾飯">吃乾飯</option>
                  <option value="初一 十五吃素">初一 十五吃素</option>
                  <option value="打包便當">打包便當</option>
                  <option value="不訂餐/自備">不訂餐/自備</option>
                  <option value="自訂">自由填寫</option>
                </select>
                {row.type === '自訂' && (
                  <input
                    type="text"
                    placeholder="自由填寫說明 (如：少鹽無肉)"
                    value={row.custom}
                    onChange={e => updateMealRow(row.id, { custom: e.target.value })}
                    className="border-2 border-emerald-500 p-2 rounded-lg flex-1 min-w-[140px] font-bold bg-white focus:outline-none"
                  />
                )}
                <button
                  onClick={() => deleteMealRow(row.id)}
                  title="刪除此列"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded-lg border border-black transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addMealRow()}
            className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>新增伙食名單</span>
          </button>
        </section>

        {/* 5. 備註區 */}
        <section className="bg-pink-100/95 rounded-2xl p-6 mb-6 pixel-card-pink">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-pink-900 flex items-center gap-2">
              <FileEdit className="w-6 h-6 text-pink-700" />
              <span>4. 備註與原因</span>
            </h2>
          </div>

          <div className="space-y-3">
            {notesList.map((row) => (
              <div
                key={row.id}
                className="bg-white p-3 rounded-xl border-2 border-black flex flex-wrap items-center gap-2 shadow-sm"
              >
                <input
                  type="text"
                  placeholder="姓名 (選填)"
                  value={row.name}
                  onChange={e => updateNoteRow(row.id, { name: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg w-32 font-bold focus:border-pink-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="請假或特別交代原因備註"
                  value={row.reason}
                  onChange={e => updateNoteRow(row.id, { reason: e.target.value })}
                  className="border-2 border-gray-400 p-2 rounded-lg flex-1 min-w-[160px] font-bold focus:border-pink-500 focus:outline-none"
                />
                <button
                  onClick={() => deleteNoteRow(row.id)}
                  title="刪除此列"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded-lg border border-black transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addNoteRow()}
            className="mt-4 w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-black py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>新增備註</span>
          </button>
        </section>

        {/* 雙核心主要操作按鈕區 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          <button
            onClick={handleGenerateText}
            className="pixel-btn pixel-btn-yellow py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-3 transition-transform active:translate-y-1 shadow-[0_6px_0_#000]"
          >
            <Copy className="w-6 h-6" />
            <span>產生文字並複製</span>
          </button>
          <button
            onClick={handleGenerateImage}
            className="pixel-btn pixel-btn-red py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-3 transition-transform active:translate-y-1 shadow-[0_6px_0_#000]"
          >
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span>產生瑪利歐圖卡預覽</span>
          </button>
        </div>

        {/* 成果展現區 1：文字預覽 */}
        {generatedText && (
          <section
            ref={textPreviewRef}
            className="bg-white rounded-2xl p-6 mb-8 pixel-box transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <h3 className="font-extrabold text-lg text-gray-900">
                  產生之請假通知文字：
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {copiedTextToast && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black border border-emerald-300 animate-pulse flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 已複製到剪貼簿！
                  </span>
                )}
                <button
                  onClick={() => copyTextToClipboard(generatedText)}
                  className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 rounded-lg border-2 border-black flex items-center gap-1 shadow-[1px_1px_0_#000]"
                >
                  <Copy className="w-3.5 h-3.5" /> 再次複製
                </button>
                <button
                  onClick={shareToLine}
                  className="text-xs font-bold bg-[#06C755] hover:bg-[#05b34c] text-white px-3 py-1.5 rounded-lg border-2 border-black flex items-center gap-1 shadow-[1px_1px_0_#000]"
                >
                  <Share2 className="w-3.5 h-3.5" /> 分享至 LINE
                </button>
              </div>
            </div>

            <textarea
              rows={Math.min(16, Math.max(7, generatedText.split('\n').length + 1))}
              value={generatedText}
              onChange={e => setGeneratedText(e.target.value)}
              className="w-full border-3 border-gray-800 p-4 rounded-xl font-mono text-sm leading-relaxed bg-amber-50/40 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 提示：文字方塊可自由微調編輯，隨後點選「再次複製」或「分享至 LINE」即可傳送！
            </p>
          </section>
        )}

        {/* 成果展現區 2：瑪利歐風格圖卡預覽 */}
        {imagePreviewUrl && (
          <section
            ref={imagePreviewRef}
            className="bg-white rounded-2xl p-6 mb-8 pixel-box text-center transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="text-left">
                <h3 className="font-extrabold text-xl text-gray-900 flex items-center gap-2">
                  <span>🌟</span> 瑪利歐冒險風格圖卡預覽
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  已自動結合可愛花栗鼠吉祥物與請假資訊，高解析度渲染完成
                </p>
              </div>

              {/* 圖卡操作按鈕列 */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadImage}
                  className="pixel-btn pixel-btn-green text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> 下載圖卡 (PNG)
                </button>
                <button
                  onClick={copyImageToClipboard}
                  className="pixel-btn pixel-btn-yellow text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" /> 複製圖卡
                </button>
              </div>
            </div>

            {copiedImgToast && (
              <div className="mb-3 text-xs bg-emerald-100 text-emerald-800 p-2 rounded-lg font-bold border border-emerald-300 inline-flex items-center gap-1">
                <Check className="w-4 h-4" /> 圖片已成功複製至剪貼簿！可直接在通訊軟體貼上 (Ctrl+V)
              </div>
            )}

            {/* 圖卡展示框 */}
            <div className="overflow-x-auto flex justify-center p-2 bg-slate-100 rounded-xl border-2 border-black">
              <img
                src={imagePreviewUrl}
                alt="長輩請假通知圖卡"
                className="max-w-full rounded-lg shadow-xl border-2 border-black transition-transform hover:scale-[1.01]"
              />
            </div>

            <p className="text-xs text-gray-500 mt-3 font-medium">
              📱 手機用戶亦可直接在上方圖片「長按 2 秒」選擇「儲存影像」或「分享」！
            </p>
          </section>
        )}

      </main>

      {/* 桌面 Icon 教學與預覽彈窗 */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-4 border-black rounded-3xl max-w-md w-full p-6 shadow-2xl relative pixel-box">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full border-2 border-black"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden border-4 border-black shadow-[4px_4px_0_#000] mb-3 bg-yellow-300">
                <img
                  src={CHIPMUNK_ICON_URL}
                  alt="可愛花栗鼠拿蘑菇桌面 Icon"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-black text-gray-900">
                可愛花栗鼠桌面 Icon 🐿️🍄
              </h3>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                長輩請假通知系統專屬吉祥物圖示
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-black rounded-xl p-3.5 mb-4 text-xs text-gray-800 space-y-2 font-bold">
              <p className="text-red-600 font-black">📲 如何新增為手機 / 電腦桌面圖示：</p>
              <div className="space-y-1.5 text-gray-700 pl-1">
                <div>
                  <span className="text-amber-800">🍏 iPhone (Safari)：</span>
                  點擊底部「分享」按鈕 ➔ 選擇「加入主畫面」。
                </div>
                <div>
                  <span className="text-blue-800">🤖 Android (Chrome)：</span>
                  點擊右上角「⋮」選單 ➔ 選擇「安裝應用程式」或「加到主畫面」。
                </div>
                <div>
                  <span className="text-emerald-800">💻 電腦 (Chrome/Edge)：</span>
                  點擊網址列右側的「安裝」圖示即可常駐桌面應用！
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadChipmunkIcon}
                className="pixel-btn pixel-btn-yellow w-full py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> 下載花栗鼠 Icon 圖片檔
              </button>
              <button
                onClick={() => setShowInstallModal(false)}
                className="pixel-btn pixel-btn-red px-5 py-2.5 rounded-xl text-xs"
              >
                好棒！
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部瑪利歐風格頁尾 */}
      <footer className="text-center text-white text-xs py-6 font-bold drop-shadow-[0_2px_2px_#000] flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <span>🐿️</span>
          <span>🍄 長輩請假通知系統 · 花栗鼠蘑菇冒險版 ✨</span>
          <span>🌟</span>
        </div>
        <p className="text-white/80 text-[11px]">
          專為日照中心、長青學苑、養護機構及長輩家庭貼心打造
        </p>
      </footer>
    </div>
  );
}
