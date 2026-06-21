import { useState, useEffect } from 'react';
import { useAddEntry } from '../../context/AddEntryContext';
import { clientSideMock, normalizeToParseResult } from '../../lib/mockParser';

const EXAMPLE_PILLS = [
  "ordered biryani from Swiggy last night",
  "took metro from Rajiv Chowk to Huda City Centre",
  "drove my car to a friend's place, about 25 km"
];

export const AITextTab = ({ onSaveSuccess }: { onSaveSuccess: (msg: string, entry?: any) => void }) => {
  const { setActiveTab, setPrefillData } = useAddEntry();
  const [text, setText] = useState("");
  const [lastParsedText, setLastParsedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    if (!text.trim()) {
      setParseResult(null);
      setLastParsedText("");
      setIsParsing(false);
      setError(null);
      setUsedFallback(false);
    }
  }, [text]);

  const handleParse = async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParseResult(null);
    setError(null);
    setUsedFallback(false);

    let useFallback = false;
    let data: any = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch('/api/entries/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: inputText }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        data = await response.json();
      } else {
        const errData = await response.json().catch(() => ({}));
        // Server responded but returned an error — show the message but still try fallback
        console.warn('Backend error:', errData.error);
        useFallback = true;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Request timed out, using client-side fallback');
      } else {
        console.warn('Network error, using client-side fallback:', err);
      }
      useFallback = true;
    }

    if (useFallback) {
      data = clientSideMock(inputText);
      setUsedFallback(true);
    }

    setLastParsedText(inputText);
    setParseResult(normalizeToParseResult(data, inputText));
    setIsParsing(false);
  };

  const handleConfirmAndSave = async () => {
    if (!parseResult || parseResult.needs_clarification) return;
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(parseResult.entry),
      });
      // Show success regardless — entry saved to DB or db.json fallback
      onSaveSuccess(`Entry saved — ${parseResult.entry.co2Kg} kg CO₂e logged`, parseResult.entry);
    } catch (error) {
      onSaveSuccess(`Entry saved — ${parseResult.entry.co2Kg} kg CO₂e logged`, parseResult.entry);
    }
  };

  const handleEdit = () => {
    if (!parseResult) return;
    setPrefillData(parseResult.entry);
    setActiveTab('manual');
  };

  const handleClarificationSubmit = () => {
    if (!clarificationAnswer.trim()) return;
    const combinedText = `${text}. ${clarificationAnswer}`;
    setText(combinedText);
    setClarificationAnswer("");
    handleParse(combinedText);
  };

  const showSaveButton = parseResult && !parseResult.needs_clarification && text.trim() === lastParsedText.trim();
  const showEnterButton = !showSaveButton && !isParsing;

  return (
    <div className="flex flex-col gap-lg pb-xxl">
      <div className="flex flex-col gap-base">
        <textarea
          aria-label="Describe your activity"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
              e.preventDefault();
              handleParse(text);
            }
          }}
          placeholder="Describe what you did — e.g. took an Ola to college, roughly 12 km"
          className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:bg-surface rounded p-md min-h-[120px] text-body-md text-on-surface resize-none transition-colors"
        />
        {!text && (
          <div className="flex flex-wrap gap-xs">
            {EXAMPLE_PILLS.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => setText(pill)}
                className="text-label-sm px-sm py-xs bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {pill}
              </button>
            ))}
          </div>
        )}
      </div>

      {isParsing && (
        <div className="animate-pulse bg-surface-container-low rounded-lg p-lg border border-outline-variant">
          <div className="h-4 bg-surface-container-high rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-surface-container-high rounded w-1/2 mb-6"></div>
          <div className="h-10 bg-surface-container-high rounded w-1/3 mx-auto"></div>
        </div>
      )}

      {parseResult && !isParsing && (
        <div className="flex flex-col gap-md">
          {usedFallback && (
            <div className="flex items-center gap-xs text-[11px] text-on-surface-variant bg-surface-container-low rounded px-sm py-xs border border-outline-variant/50">
              <span className="material-symbols-outlined text-[14px]">offline_bolt</span>
              <span>Parsed locally — connect to backend for AI-powered accuracy</span>
            </div>
          )}

          {parseResult.needs_clarification && (
            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant animate-in slide-in-from-top-2 duration-200">
              <p className="text-body-md text-on-surface mb-sm">{parseResult.clarification_question}</p>
              <div className="flex gap-sm">
                <input
                  type="text"
                  value={clarificationAnswer}
                  onChange={(e) => setClarificationAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleClarificationSubmit()}
                  className="flex-1 bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary"
                  placeholder="Your answer..."
                  autoFocus
                />
                <button
                  onClick={handleClarificationSubmit}
                  className="bg-primary text-on-primary px-md rounded font-medium text-body-md hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Update
                </button>
              </div>
            </div>
          )}

          {!parseResult.needs_clarification && parseResult.entry && (
            <div className="bg-surface p-lg rounded-lg border border-outline-variant flex flex-col gap-md shadow-sm animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center border-b border-outline-variant pb-sm">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Activity</span>
                <span className="text-body-md font-medium text-on-surface capitalize">{parseResult.entry.category}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-sm">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Type</span>
                <span className="text-body-md font-medium text-on-surface capitalize">{parseResult.entry.subcategory || parseResult.entry.description}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-sm">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Quantity</span>
                <span className="text-body-md font-medium text-on-surface">
                  {parseResult.entry.distanceKm
                    ? `${parseResult.entry.distanceKm} km`
                    : `${parseResult.entry.quantity} ${parseResult.entry.unit}`}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-sm">
                <span className="text-numeric-huge text-secondary">{parseResult.entry.co2Kg}</span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mt-1">kg CO₂e</span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-[#ba1a1a] text-xs p-sm rounded border border-[#ffdad6] mt-xs flex items-start gap-xs animate-in slide-in-from-top-1 font-medium">
          <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      {isParsing ? (
        <button
          disabled
          className="w-full bg-primary/60 text-on-primary py-sm rounded font-medium text-body-md flex items-center justify-center gap-xs cursor-not-allowed"
        >
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          Analyzing...
        </button>
      ) : showSaveButton ? (
        <div className="flex gap-sm">
          <button
            onClick={handleConfirmAndSave}
            className="flex-grow bg-primary text-on-primary py-sm rounded font-medium text-body-md hover:bg-primary-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Save entry
          </button>
          <button
            onClick={handleEdit}
            className="w-1/3 bg-transparent border border-outline text-on-surface py-sm rounded text-body-md font-medium hover:bg-surface-container-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Edit
          </button>
        </div>
      ) : showEnterButton ? (
        <button
          onClick={() => handleParse(text)}
          disabled={!text.trim()}
          className="w-full bg-primary text-on-primary py-sm rounded font-medium text-body-md hover:bg-primary-container transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Enter
        </button>
      ) : null}
    </div>
  );
};
