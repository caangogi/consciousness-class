'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Wand2, Plus, Minus, HeartHandshake, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';

interface AssistiveMarkdownEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
}

export function AssistiveMarkdownEditor({ initialContent, onChange }: AssistiveMarkdownEditorProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // @ts-ignore
      onChange(editor.storage.markdown.getMarkdown());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection && containerRef.current) {
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          setMenuPosition({
            top: rect.top - containerRect.top - 52, // above selection
            left: Math.max(0, rect.left - containerRect.left + rect.width / 2 - 160),
          });
          setMenuVisible(true);
        }
      } else {
        setMenuVisible(false);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] bg-background/80 p-6 rounded-xl border border-border shadow-inner',
      },
    },
  });

  const handleAiAction = useCallback(async (action: 'improve' | 'expand' | 'summarize' | 'empathize') => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText || selectedText.trim() === '') {
      toast({ title: 'Selección vacía', description: 'Selecciona texto primero.', variant: 'default' });
      return;
    }

    setIsProcessing(true);
    setMenuVisible(false);

    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/assets/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ action, text: selectedText })
      });

      const data = await res.json();

      if (res.ok && data.text) {
        editor.chain().focus().deleteSelection().insertContent(data.text).run();
        toast({ title: '✨ Texto mejorado', description: `Acción: ${action}` });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Error AI', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [editor, toast]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="relative">

      {/* Floating AI Bubble Menu — rendered manually, no @tiptap/react BubbleMenu needed */}
      {menuVisible && (
        <div
          className="absolute z-50 flex items-center gap-1 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-2xl p-1.5 transition-all"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onMouseDown={(e) => e.preventDefault()} // prevent blur on click
        >
          {isProcessing ? (
            <div className="px-3 py-1.5 flex items-center text-xs font-medium text-brand-sandstone">
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Procesando...
            </div>
          ) : (
            <>
              <div className="px-2 py-1 flex items-center gap-1 border-r border-border/50 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-sandstone" />
                <span className="text-[11px] font-bold text-brand-sandstone">IA</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleAiAction('improve')}
                className="h-7 text-[11px] px-2 rounded-lg hover:bg-secondary/60">
                <Wand2 className="w-3 h-3 mr-1" /> Mejorar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleAiAction('expand')}
                className="h-7 text-[11px] px-2 rounded-lg hover:bg-secondary/60">
                <Plus className="w-3 h-3 mr-1" /> Expandir
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleAiAction('summarize')}
                className="h-7 text-[11px] px-2 rounded-lg hover:bg-secondary/60">
                <Minus className="w-3 h-3 mr-1" /> Resumir
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleAiAction('empathize')}
                className="h-7 text-[11px] px-2 rounded-lg hover:bg-secondary/60 text-rose-500">
                <HeartHandshake className="w-3 h-3 mr-1" /> Empatía
              </Button>
            </>
          )}
        </div>
      )}

      <div className="relative group">
        <EditorContent editor={editor} />
        <div className="absolute bottom-3 right-3 opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none">
          <span className="text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded-lg border border-border/50">
            Selecciona texto → menú IA
          </span>
        </div>
      </div>
    </div>
  );
}
