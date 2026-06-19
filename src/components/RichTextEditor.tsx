import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import Color from '@tiptap/extension-color';
import TiptapLink from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { mergeAttributes, Mark } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, Type, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Link2, Maximize2, Video, Trash2, LayoutTemplate
} from 'lucide-react';

/* ─── Extensions ─── */
const CustomLink = TiptapLink.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('class'), renderHTML: (attrs: Record<string, any>) => attrs.class ? { class: attrs.class } : {} },
      style: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('style'), renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {} },
    };
  },
});

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('style'), renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {} },
    };
  },
});

const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('style'), renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {} },
    };
  },
});

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('width'), renderHTML: (attrs: Record<string, any>) => attrs.width ? { width: attrs.width } : {} },
      height: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('height'), renderHTML: (attrs: Record<string, any>) => attrs.height ? { height: attrs.height } : {} },
      style: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('style'), renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {} },
    };
  },
});

const CustomYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('style'), renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {} },
    };
  },
});

const UppercaseMark = Mark.create({
  name: 'uppercase',
  parseHTML() {
    return [{ style: 'text-transform: uppercase' }];
  },
  renderHTML() {
    return ['span', { style: 'text-transform: uppercase' }, 0];
  },
});

import { Node } from '@tiptap/core';

const Card = Node.create({
  name: 'card',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      style: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('style'), renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {} },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-card]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-card': '' }), 0];
  },
});

const ImageGrid = Node.create({
  name: 'imageGrid',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      columns: { default: 2, parseHTML: (el: HTMLElement) => Number(el.getAttribute('data-columns') || 2) },
      urls: { default: [], parseHTML: (el: HTMLElement) => Array.from(el.querySelectorAll('img')).map(img => img.getAttribute('src') || '') },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-image-grid]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const cols = (HTMLAttributes.columns as number) || 2;
    const urls = ((HTMLAttributes.urls as string[]) || []);
    const children = urls.map((url: string) => ['img', { src: url, style: 'display:block;width:100%;height:auto;border-radius:4px;' }]);
    return ['div', { 'data-image-grid': '', 'data-columns': String(cols), class: `image-grid image-grid-${cols}` }, ...children];
  },
});

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={"w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none focus:ring-0 focus:border-neutral-600 "+(props.className||"")} />
);

/* ─── Component ─── */
export const RichTextEditor: React.FC<{
  value: string;
  onChange: (html: string) => void;
  onPickImage?: (insert: (url: string, alt?: string) => void) => void;
  galleries?: Array<{ year: number; name: string; items?: Array<{ type: string; url: string; title?: string }> }>;
}> = ({ value, onChange, onPickImage, galleries }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ paragraph: false, heading: false }),
      CustomParagraph,
      CustomHeading.configure({ levels: [1, 2, 3] }),
      TextStyle,
      Color,
      Underline,
      CustomLink.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      CustomImage,
      CustomYoutube.configure({ width: 640, height: 360 }),
      UppercaseMark,
      Card,
      ImageGrid,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      let html = editor.getHTML();
      // Ensure empty paragraphs render with space in preview
      html = html.replace(/<p><\/p>/g, '<p>\u00a0</p>');
      onChange(html);
    },
  });

  // Sync external value changes (language switch, initial load)
  useEffect(() => {
    if (editor && editor.isEditable) {
      const current = editor.getHTML();
      if (current !== value) {
        editor.commands.setContent(value || '<p></p>', false);
      }
    }
  }, [value, editor]);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkIsButton, setLinkIsButton] = useState(false);
  const [linkButtonColor, setLinkButtonColor] = useState('#000000');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryYear, setGalleryYear] = useState<number | ''>('');
  const [galleryName, setGalleryName] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageRatios, setImageRatios] = useState<Record<string, 'portrait' | 'landscape' | 'square'>>({});
  const [linkMenuOpen, setLinkMenuOpen] = useState(false);
  const [imgSizeOpen, setImgSizeOpen] = useState(false);
  const [imgPercent, setImgPercent] = useState<string>('100');
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubePercent, setYoutubePercent] = useState<string>('100');
  const [videoSizeOpen, setVideoSizeOpen] = useState(false);
  const [videoPercent, setVideoPercent] = useState<string>('100');
  const [cardOpen, setCardOpen] = useState(false);
  const [cardEdit, setCardEdit] = useState(false);
  const [cardUseBg, setCardUseBg] = useState(true);
  const [cardBg, setCardBg] = useState('#1f2937');
  const [cardBgOpacity, setCardBgOpacity] = useState('15');
  const [cardBg2, setCardBg2] = useState('#000000');
  const [cardBg2Opacity, setCardBg2Opacity] = useState('15');
  const [cardGradientType, setCardGradientType] = useState<'solid' | 'linear' | 'radial'>('solid');
  const [cardGradientDir, setCardGradientDir] = useState('180');
  const [cardBorderColor, setCardBorderColor] = useState('#374151');
  const [cardBorderOpacity, setCardBorderOpacity] = useState('30');
  const [cardBorderWidth, setCardBorderWidth] = useState('1');
  const [cardBorderRadius, setCardBorderRadius] = useState('8');
  const [cardPadding, setCardPadding] = useState('16');
  const [cardWidth, setCardWidth] = useState('90');
  const [cardHasBorder, setCardHasBorder] = useState(true);

  const galleryYears = useMemo(() => {
    if (!galleries) return [] as number[];
    return [...new Set(galleries.map(g => g.year))].sort((a, b) => b - a);
  }, [galleries]);

  if (!editor) return <div className="text-neutral-400 text-sm">Editor lädt…</div>;

  const btnBase = 'px-2 py-1.5 hover:bg-neutral-700/40 rounded text-sm select-none flex items-center justify-center min-w-[32px]';
  const btnActive = 'bg-neutral-600/70 text-white';
  const currentColor = (editor.getAttributes('textStyle') as any)?.color as string | undefined;

  const insertLink = () => {
    if (!linkUrl.trim()) { setLinkOpen(false); return; }
    const label = linkText.trim() || linkUrl;
    if (linkIsButton) {
      editor.chain().focus().insertContent({
        type: 'text',
        text: label,
        marks: [{
          type: 'link',
          attrs: {
            href: linkUrl,
            class: 'button-link',
            style: `display:inline-block;padding:8px 16px;border-radius:6px;background:${linkButtonColor};color:#fff;text-decoration:none;`,
          },
        }],
      }).run();
    } else {
      editor.chain().focus().insertContent({
        type: 'text',
        text: label,
        marks: [{ type: 'link', attrs: { href: linkUrl } }],
      }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
    setLinkText('');
    setLinkIsButton(false);
    setLinkButtonColor('#000000');
  };

  const setAlign = (align: 'left'|'center'|'right'|'justify') => {
    const attrs = { style: `text-align: ${align}` };
    editor.chain().focus().updateAttributes('paragraph', attrs).run();
    editor.chain().focus().updateAttributes('heading', attrs).run();
  };

  const getAlign = (): 'left'|'center'|'right'|'justify' => {
    const node = editor.state.selection.$from.node();
    const style = (node.attrs?.style || '') as string;
    const m = style.match(/text-align:\s*(left|center|right|justify)/);
    return (m?.[1] as any) || 'left';
  };

  const setFontSize = (size: string) => {
    const updateStyle = (nodeType: string) => {
      const attrs = editor.getAttributes(nodeType as any);
      let style = (attrs.style || '') as string;
      style = style.replace(/font-size:\s*[^;]+;?/g, '').trim();
      style = style ? `${style};font-size:${size}` : `font-size:${size}`;
      editor.chain().focus().updateAttributes(nodeType as any, { style }).run();
    };
    updateStyle('paragraph');
    updateStyle('heading');
  };

  const applyImageSize = () => {
    const current = editor.getAttributes('image');
    let style = (current.style || '') as string;
    style = style.replace(/width:\s*[^;]+;?/g, '').replace(/display:\s*block;?/g, '');
    if (imgPercent && imgPercent !== '100') {
      style += ` width:${imgPercent}%; display:block;`;
    }
    editor.chain().focus().updateAttributes('image', { style: style.trim() }).run();
    setImgSizeOpen(false);
  };

  const setImageAlign = (align: 'left' | 'center' | 'right' | 'full') => {
    const current = editor.getAttributes('image');
    let style = (current.style || '') as string;
    style = style.replace(/float:\s*(left|right);?/g, '').replace(/margin:\s*[^;]+;?/g, '').replace(/margin-left:\s*auto;?/g, '').replace(/margin-right:\s*auto;?/g, '');
    if (align === 'left') style += ' float:left; margin-right:12px; margin-bottom:8px;';
    else if (align === 'right') style += ' float:right; margin-left:12px; margin-bottom:8px;';
    else if (align === 'center') style += ' display:block; margin-left:auto; margin-right:auto;';
    else if (align === 'full') { /* nothing extra, just no float */ }
    editor.chain().focus().updateAttributes('image', { style: style.trim() }).run();
  };

  const getImageAlign = (): 'left' | 'center' | 'right' | 'full' => {
    const style = (editor.getAttributes('image').style || '') as string;
    if (style.includes('float:left')) return 'left';
    if (style.includes('float:right')) return 'right';
    if (style.includes('margin-left:auto') && style.includes('margin-right:auto')) return 'center';
    return 'full';
  };

  const insertYoutube = () => {
    if (!youtubeUrl.trim()) { setYoutubeOpen(false); return; }
    const style = youtubePercent && youtubePercent !== '100' ? `width:${youtubePercent}%;` : '';
    editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    if (style) {
      editor.chain().focus().updateAttributes('youtube', { style }).run();
    }
    setYoutubeOpen(false);
    setYoutubeUrl('');
    setYoutubePercent('100');
  };

  const applyVideoSize = () => {
    const current = editor.getAttributes('youtube');
    let style = (current.style || '') as string;
    style = style.replace(/width:\s*[^;]+;?/g, '').replace(/display:\s*block;?/g, '');
    if (videoPercent && videoPercent !== '100') {
      style += ` width:${videoPercent}%; display:block;`;
    }
    editor.chain().focus().updateAttributes('youtube', { style: style.trim() }).run();
    setVideoSizeOpen(false);
  };

  const setVideoAlign = (align: 'left' | 'center' | 'right' | 'full') => {
    const current = editor.getAttributes('youtube');
    let style = (current.style || '') as string;
    style = style.replace(/float:\s*(left|right);?/g, '').replace(/margin:\s*[^;]+;?/g, '').replace(/margin-left:\s*auto;?/g, '').replace(/margin-right:\s*auto;?/g, '');
    if (align === 'left') style += ' float:left; margin-right:12px; margin-bottom:8px;';
    else if (align === 'right') style += ' float:right; margin-left:12px; margin-bottom:8px;';
    else if (align === 'center') style += ' display:block; margin-left:auto; margin-right:auto;';
    else if (align === 'full') { /* nothing extra */ }
    editor.chain().focus().updateAttributes('youtube', { style: style.trim() }).run();
  };

  const getVideoAlign = (): 'left' | 'center' | 'right' | 'full' => {
    const style = (editor.getAttributes('youtube').style || '') as string;
    if (style.includes('float:left')) return 'left';
    if (style.includes('float:right')) return 'right';
    if (style.includes('margin-left:auto') && style.includes('margin-right:auto')) return 'center';
    return 'full';
  };

  const hexToRgba = (hex: string, opacity: string): string => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const a = Math.max(0, Math.min(1, parseInt(opacity) / 100));
    return `rgba(${r},${g},${b},${a})`;
  };

  const parseRgba = (rgba: string): { hex: string; opacity: string } => {
    const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!m) return { hex: '#1f2937', opacity: '20' };
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return { hex: `#${toHex(parseInt(m[1]))}${toHex(parseInt(m[2]))}${toHex(parseInt(m[3]))}`, opacity: String(Math.round(parseFloat(m[4]) * 100)) };
  };

  const buildCardStyle = (): string => {
    const styles: string[] = [];
    if (cardUseBg) {
      const c1 = hexToRgba(cardBg, cardBgOpacity);
      const c2 = hexToRgba(cardBg2, cardBg2Opacity);
      if (cardGradientType === 'linear') {
        styles.push(`background:linear-gradient(${cardGradientDir}deg, ${c1}, ${c2})`);
      } else if (cardGradientType === 'radial') {
        styles.push(`background:radial-gradient(circle, ${c1}, ${c2})`);
      } else {
        styles.push(`background:${c1}`);
      }
    }
    if (cardPadding) styles.push(`padding:${cardPadding}px`);
    if (cardHasBorder && cardBorderWidth && cardBorderColor) {
      styles.push(`border:${cardBorderWidth}px solid ${hexToRgba(cardBorderColor, cardBorderOpacity)}`);
    }
    if (cardBorderRadius) styles.push(`border-radius:${cardBorderRadius}px`);
    if (cardWidth && cardWidth !== '100') styles.push(`width:${cardWidth}%`);
    if (cardWidth && cardWidth !== '100') styles.push('margin-left:auto;margin-right:auto');
    return styles.join(';');
  };

  const parseCardStyle = (style: string) => {
    const bgMatch = style.match(/background:\s*([^;]+)/);
    const pad = style.match(/padding:\s*([^;]+)/)?.[1] || '16';
    const border = style.match(/border:\s*([^;]+)/)?.[1] || '';
    const radius = style.match(/border-radius:\s*([^;]+)/)?.[1] || '8';
    const width = style.match(/width:\s*(\d+)%/)?.[1] || '100';
    const hasBorder = !!border;
    const bw = border.match(/(\d+)px/)?.[1] || '1';
    const bcRaw = border.match(/solid\s+(.+)/)?.[1] || 'rgba(55,65,81,0.3)';
    const bcParsed = parseRgba(bcRaw);
    const useBg = !!bgMatch;
    let gType: 'solid' | 'linear' | 'radial' = 'solid';
    let gDir = '180';
    let bg1 = { hex: '#1f2937', opacity: '20' };
    let bg2 = { hex: '#000000', opacity: '0' };
    if (bgMatch) {
      const bgVal = bgMatch[1].trim();
      if (bgVal.startsWith('linear-gradient')) {
        gType = 'linear';
        const dir = bgVal.match(/linear-gradient\((\d+)deg/);
        if (dir) gDir = dir[1];
        const colors = bgVal.match(/rgba\([^)]+\)/g);
        if (colors && colors.length >= 2) { bg1 = parseRgba(colors[0]); bg2 = parseRgba(colors[1]); }
      } else if (bgVal.startsWith('radial-gradient')) {
        gType = 'radial';
        const colors = bgVal.match(/rgba\([^)]+\)/g);
        if (colors && colors.length >= 2) { bg1 = parseRgba(colors[0]); bg2 = parseRgba(colors[1]); }
      } else {
        gType = 'solid';
        bg1 = parseRgba(bgVal);
      }
    }
    return { useBg, bg: bg1.hex, bgOpacity: bg1.opacity, bg2: bg2.hex, bg2Opacity: bg2.opacity, gradientType: gType, gradientDir: gDir, padding: pad.replace('px',''), width, borderWidth: bw, borderColor: bcParsed.hex, borderOpacity: bcParsed.opacity, borderRadius: radius.replace('px',''), hasBorder };
  };

  const insertCard = () => {
    const style = buildCardStyle();
    if (cardEdit && editor.isActive('card')) {
      editor.chain().focus().updateAttributes('card', { style }).run();
    } else {
      editor.chain().focus().insertContent({ type: 'card', attrs: { style }, content: [{ type: 'paragraph' }] }).run();
    }
    setCardOpen(false);
    setCardEdit(false);
  };

  const openCardDialog = (edit = false) => {
    if (edit && editor.isActive('card')) {
      const style = (editor.getAttributes('card').style || '') as string;
      const p = parseCardStyle(style);
      setCardUseBg(p.useBg);
      setCardBg(p.bg);
      setCardBgOpacity(p.bgOpacity);
      setCardBg2(p.bg2);
      setCardBg2Opacity(p.bg2Opacity);
      setCardGradientType(p.gradientType);
      setCardGradientDir(p.gradientDir);
      setCardPadding(p.padding);
      setCardWidth(p.width);
      setCardBorderWidth(p.borderWidth);
      setCardBorderColor(p.borderColor);
      setCardBorderOpacity(p.borderOpacity);
      setCardBorderRadius(p.borderRadius);
      setCardHasBorder(p.hasBorder);
      setCardEdit(true);
    } else {
      setCardUseBg(true);
      setCardBg('#76101b');
      setCardBgOpacity('15');
      setCardBg2('#400a10');
      setCardBg2Opacity('15');
      setCardGradientType('radial');
      setCardGradientDir('180');
      setCardPadding('16');
      setCardWidth('90');
      setCardBorderWidth('2');
      setCardBorderColor('#8C1423');
      setCardBorderOpacity('15');
      setCardBorderRadius('16');
      setCardHasBorder(true);
      setCardEdit(false);
    }
    setCardOpen(true);
  };

  const TbButton: React.FC<{ icon: React.ReactNode; active?: boolean; title?: string; onClick: () => void; }> = ({ icon, active, title, onClick }) => (
    <button type="button" title={title} className={`${btnBase} ${active ? btnActive : ''}`} onMouseDown={(e) => { e.preventDefault(); onClick(); }}>{icon}</button>
  );

  const align = getAlign();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 rounded bg-neutral-800/60 border border-neutral-700/40 text-neutral-200 text-sm mb-1">
        <TbButton icon={<Bold size={16} />} active={editor.isActive('bold')} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
        <TbButton icon={<Italic size={16} />} active={editor.isActive('italic')} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
        <TbButton icon={<UnderlineIcon size={16} />} active={editor.isActive('underline')} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <TbButton icon={<span className="text-xs font-bold">AA</span>} active={editor.isActive('uppercase')} title="Großbuchstaben" onClick={() => editor.chain().focus().toggleMark('uppercase').run()} />
        <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
        <TbButton icon={<Type size={16} />} active={editor.isActive('paragraph')} title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} />
        <TbButton icon={<Heading2 size={16} />} active={editor.isActive('heading', { level: 2 })} title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <TbButton icon={<Heading3 size={16} />} active={editor.isActive('heading', { level: 3 })} title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
        <TbButton icon={<List size={16} />} active={editor.isActive('bulletList')} title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <TbButton icon={<ListOrdered size={16} />} active={editor.isActive('orderedList')} title="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
        <TbButton icon={<AlignLeft size={16} />} active={align==='left'} title="Align Left" onClick={() => setAlign('left')} />
        <TbButton icon={<AlignCenter size={16} />} active={align==='center'} title="Align Center" onClick={() => setAlign('center')} />
        <TbButton icon={<AlignRight size={16} />} active={align==='right'} title="Align Right" onClick={() => setAlign('right')} />
        <TbButton icon={<AlignJustify size={16} />} active={align==='justify'} title="Align Justify" onClick={() => setAlign('justify')} />
        <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
        {/* Font size */}
        <div className="relative inline-block">
          <TbButton icon={<span className="text-xs font-bold">A</span>} title="Font Size" onClick={() => {}} />
          <select
            className="absolute inset-0 opacity-0 cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => { setFontSize(e.target.value); }}
            value=""
          >
            <option value="" disabled>Size</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
            <option value="48px">48px</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <input type="color" value={typeof currentColor==='string' && currentColor ? currentColor : '#000000'} onChange={(e) => { (editor.chain().focus() as any).setColor(e.target.value).run(); }} className="h-6 w-8 rounded border border-neutral-700/40 bg-neutral-900 cursor-pointer" title="Text Color" />
          <TbButton icon={<span className="text-xs">↺ Reset</span>} title="Alle Textfarben zurücksetzen (theme-abhängig)" onClick={() => (editor.chain().focus() as any).selectAll().unsetColor().run()} />
        </div>
        <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
        {/* Link dropdown */}
        <div className="relative inline-block">
          <TbButton icon={<Link2 size={16} />} active={editor.isActive('link')} title="Links" onClick={() => setLinkMenuOpen(p => !p)} />
          {linkMenuOpen && (
            <div className="absolute top-full left-0 mt-1 z-40 min-w-[180px] rounded-lg bg-neutral-900 border border-neutral-700/40 shadow-xl py-1">
              <button type="button" className="w-full text-left px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800" onMouseDown={(e) => { e.preventDefault(); setLinkMenuOpen(false); const prev = editor.getAttributes('link')?.href as string | undefined; const url = window.prompt('Link-URL', prev || ''); if (url === null) return; const next = url.trim(); if (!next) { editor.chain().focus().unsetLink().run(); return; } if (editor.state.selection.empty) { editor.chain().focus().insertContent({ type: 'text', text: next, marks: [{ type: 'link', attrs: { href: next } }] }).run(); } else { editor.chain().focus().setLink({ href: next }).run(); } }}>Link einfügen</button>
              <button type="button" className="w-full text-left px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800" onMouseDown={(e) => { e.preventDefault(); setLinkMenuOpen(false); setLinkOpen(true); }}>Link+ (Dialog)</button>
              <button type="button" className="w-full text-left px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800" onMouseDown={(e) => { e.preventDefault(); setLinkMenuOpen(false); editor.chain().focus().unsetLink().run(); }}>Link entfernen</button>
            </div>
          )}
        </div>
        {onPickImage && (
          <TbButton icon={<ImageIcon size={16} />} title="Bild per URL" onClick={() => onPickImage((url, alt) => editor.chain().focus().setImage({ src: url, alt: alt || '' }).run())} />
        )}
        {galleries && galleries.length > 0 && (
          <TbButton icon={<span className="text-xs">Galerie</span>} title="Bild aus Galerie" onClick={() => { setGalleryOpen(true); setGalleryYear(''); setGalleryName(''); setSelectedImages([]); setImageRatios({}); }} />
        )}
        {editor.isActive('image') && (
          <>
            <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
            <TbButton icon={<AlignLeft size={16} />} active={getImageAlign()==='left'} title="Bild links" onClick={() => setImageAlign('left')} />
            <TbButton icon={<AlignCenter size={16} />} active={getImageAlign()==='center'} title="Bild mittig" onClick={() => setImageAlign('center')} />
            <TbButton icon={<AlignRight size={16} />} active={getImageAlign()==='right'} title="Bild rechts" onClick={() => setImageAlign('right')} />
            <TbButton icon={<Maximize2 size={16} />} title="Bildgröße" onClick={() => { const m = (editor.getAttributes('image').style||'').match(/width:(\d+)%/); setImgPercent(m ? m[1] : '100'); setImgSizeOpen(true); }} />
            <TbButton icon={<Trash2 size={16} />} title="Bild löschen" onClick={() => editor.chain().focus().deleteSelection().run()} />
          </>
        )}
        {editor.isActive('youtube') && (
          <>
            <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
            <TbButton icon={<AlignLeft size={16} />} active={getVideoAlign()==='left'} title="Video links" onClick={() => setVideoAlign('left')} />
            <TbButton icon={<AlignCenter size={16} />} active={getVideoAlign()==='center'} title="Video mittig" onClick={() => setVideoAlign('center')} />
            <TbButton icon={<AlignRight size={16} />} active={getVideoAlign()==='right'} title="Video rechts" onClick={() => setVideoAlign('right')} />
            <TbButton icon={<Maximize2 size={16} />} active={getVideoAlign()==='full'} title="Video volle Breite" onClick={() => setVideoAlign('full')} />
            <TbButton icon={<Maximize2 size={16} />} title="Videogröße" onClick={() => { const attrs = editor.getAttributes('youtube'); const m = (attrs.style||'').match(/width:(\d+)%/); setVideoPercent(m ? m[1] : '100'); setVideoSizeOpen(true); }} />
            <TbButton icon={<Trash2 size={16} />} title="Video löschen" onClick={() => editor.chain().focus().deleteSelection().run()} />
          </>
        )}
        <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
        <TbButton icon={<Video size={16} />} title="YouTube Video" onClick={() => setYoutubeOpen(true)} />
        <div className="w-px h-5 bg-neutral-700/40 mx-0.5" />
        <TbButton icon={<LayoutTemplate size={16} />} active={editor.isActive('card')} title={editor.isActive('card') ? 'Card bearbeiten' : 'Card einfügen'} onClick={() => openCardDialog(editor.isActive('card'))} />
        {editor.isActive('card') && (
          <TbButton icon={<Trash2 size={16} />} title="Card löschen" onClick={() => editor.chain().focus().deleteSelection().run()} />
        )}
      </div>
      {/* Link menu click-away */}
      {linkMenuOpen && <div className="fixed inset-0 z-30" onClick={() => setLinkMenuOpen(false)} />}
      {/* Link Dialog */}
      {linkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) setLinkOpen(false); }}>
          <div className="w-full max-w-md mx-4 p-4 rounded-xl bg-neutral-900 border border-neutral-700/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 font-medium">Link einfügen</h3>
              <button type="button" onClick={() => setLinkOpen(false)} className="text-neutral-400 hover:text-neutral-200">✕</button>
            </div>
            <div className="space-y-2">
              <Input placeholder="URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
              <Input placeholder="Link-Text" value={linkText} onChange={e => setLinkText(e.target.value)} />
              <label className="flex items-center gap-2 text-neutral-200 text-sm">
                <input type="checkbox" checked={linkIsButton} onChange={e => setLinkIsButton(e.target.checked)} />
                Als Button darstellen
              </label>
              {linkIsButton && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-300 text-sm">Button-Farbe:</span>
                  <input type="color" value={linkButtonColor} onChange={e => setLinkButtonColor(e.target.value)} className="h-6 w-8 rounded border border-neutral-700/40 bg-neutral-900" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setLinkOpen(false)} className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-sm">Abbrechen</button>
              <button type="button" onClick={insertLink} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm">Einfügen</button>
            </div>
          </div>
        </div>
      )}
      {/* Gallery Picker */}
      {galleryOpen && galleries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) setGalleryOpen(false); }}>
          <div className="w-full max-w-2xl mx-4 p-4 rounded-xl bg-neutral-900 border border-neutral-700/40 shadow-xl space-y-3 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 font-medium">Bilder aus Galerie wählen</h3>
              <button type="button" onClick={() => setGalleryOpen(false)} className="text-neutral-400 hover:text-neutral-200">✕</button>
            </div>
            {/* Year / Gallery filters */}
            <div className="flex gap-2">
              <select
                className="flex-1 px-2 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm"
                value={galleryYear === '' ? '' : String(galleryYear)}
                onChange={e => {
                  const y = e.target.value ? Number(e.target.value) : '';
                  setGalleryYear(y);
                  setGalleryName('');
                  setSelectedImages([]);
                }}
              >
                <option value="">Alle Jahre</option>
                {galleryYears.map((y: number) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                className="flex-1 px-2 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm"
                value={galleryName ? `${galleryYear}::${galleryName}` : ''}
                onChange={e => {
                  const val = e.target.value;
                  if (!val) { setGalleryName(''); setSelectedImages([]); return; }
                  const [y, name] = val.split('::');
                  setGalleryYear(Number(y));
                  setGalleryName(name);
                  setSelectedImages([]);
                }}
              >
                <option value="">Galerie wählen…</option>
                {galleries
                  .filter(g => galleryYear === '' || g.year === galleryYear)
                  .map(g => (
                    <option key={`${g.year}::${g.name}`} value={`${g.year}::${g.name}`}>{g.year} — {g.name}</option>
                  ))}
              </select>
            </div>
            {/* Images grid with multi-select */}
            {(() => {
              const g = galleries.find(g => g.year === Number(galleryYear) && g.name === galleryName);
              const images = (g?.items || []).filter(it => it.type === 'image');
              if (galleryName && images.length === 0) return <div className="text-xs text-neutral-500">Keine Bilder in dieser Galerie.</div>;
              if (!galleryName) return <div className="text-xs text-neutral-500">Bitte eine Galerie auswählen.</div>;
              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images.map((it, i) => {
                    const orderNum = selectedImages.indexOf(it.url) + 1;
                    const ratio = imageRatios[it.url];
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const url = it.url;
                          setSelectedImages(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImages.includes(it.url) ? 'border-[#4ECBD9] ring-2 ring-[#4ECBD9]/30' : 'border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        <img
                          src={it.url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            const w = img.naturalWidth;
                            const h = img.naturalHeight;
                            if (w && h) {
                              const r = h / w;
                              const orientation = r > 1.15 ? 'portrait' : r < 0.87 ? 'landscape' : 'square';
                              setImageRatios(prev => ({ ...prev, [it.url]: orientation }));
                            }
                          }}
                        />
                        {/* Orientation badge */}
                        {ratio && (
                          <div className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[10px] font-bold leading-none shadow ${
                            ratio === 'portrait' ? 'bg-blue-600 text-white' :
                            ratio === 'landscape' ? 'bg-green-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {ratio === 'portrait' ? 'H' : ratio === 'landscape' ? 'Q' : '□'}
                          </div>
                        )}
                        {/* Selection order number */}
                        {selectedImages.includes(it.url) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="text-white text-lg font-bold">{orderNum}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            {/* Actions */}
            {selectedImages.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-neutral-300 text-sm">{selectedImages.length} ausgewählt</span>
                <button
                  type="button"
                  onClick={() => {
                    const nodes = selectedImages.map(url => ({ type: 'image', attrs: { src: url, alt: '' } }));
                    editor.chain().focus().insertContent(nodes).run();
                    setSelectedImages([]);
                    setGalleryOpen(false);
                  }}
                  className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-sm"
                >
                  Als Einzelbilder einfügen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().insertContent({ type: 'imageGrid', attrs: { columns: 2, urls: selectedImages } }).run();
                    setSelectedImages([]);
                    setGalleryOpen(false);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm"
                >
                  2er-Grid einfügen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().insertContent({ type: 'imageGrid', attrs: { columns: 3, urls: selectedImages } }).run();
                    setSelectedImages([]);
                    setGalleryOpen(false);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm"
                >
                  3er-Grid einfügen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().insertContent({ type: 'imageGrid', attrs: { columns: 4, urls: selectedImages } }).run();
                    setSelectedImages([]);
                    setGalleryOpen(false);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm"
                >
                  4er-Grid einfügen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Image Size Dialog */}
      {imgSizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) setImgSizeOpen(false); }}>
          <div className="w-full max-w-sm mx-4 p-4 rounded-xl bg-neutral-900 border border-neutral-700/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 font-medium">Bildgröße</h3>
              <button type="button" onClick={() => setImgSizeOpen(false)} className="text-neutral-400 hover:text-neutral-200">✕</button>
            </div>
            <div>
              <label className="text-neutral-300 text-sm block mb-1">Breite: {imgPercent}%</label>
              <input type="range" min="25" max="100" step="5" value={imgPercent} onChange={e => setImgPercent(e.target.value)} className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-neutral-500 mt-1"><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setImgSizeOpen(false)} className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-sm">Abbrechen</button>
              <button type="button" onClick={applyImageSize} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm">Anwenden</button>
            </div>
          </div>
        </div>
      )}
      {/* YouTube Dialog */}
      {youtubeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) setYoutubeOpen(false); }}>
          <div className="w-full max-w-md mx-4 p-4 rounded-xl bg-neutral-900 border border-neutral-700/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 font-medium">YouTube Video einfügen</h3>
              <button type="button" onClick={() => setYoutubeOpen(false)} className="text-neutral-400 hover:text-neutral-200">✕</button>
            </div>
            <div className="space-y-2">
              <Input placeholder="YouTube-URL (z.B. https://youtube.com/watch?v=...)" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
              <div>
                <label className="text-neutral-300 text-sm block mb-1">Breite: {youtubePercent}%</label>
                <input type="range" min="25" max="100" step="5" value={youtubePercent} onChange={e => setYoutubePercent(e.target.value)} className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-neutral-500 mt-1"><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setYoutubeOpen(false)} className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-sm">Abbrechen</button>
              <button type="button" onClick={insertYoutube} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm">Einfügen</button>
            </div>
          </div>
        </div>
      )}
      {/* Video Size Dialog */}
      {videoSizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) setVideoSizeOpen(false); }}>
          <div className="w-full max-w-sm mx-4 p-4 rounded-xl bg-neutral-900 border border-neutral-700/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 font-medium">Videogröße</h3>
              <button type="button" onClick={() => setVideoSizeOpen(false)} className="text-neutral-400 hover:text-neutral-200">✕</button>
            </div>
            <div>
              <label className="text-neutral-300 text-sm block mb-1">Breite: {videoPercent}%</label>
              <input type="range" min="25" max="100" step="5" value={videoPercent} onChange={e => setVideoPercent(e.target.value)} className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-neutral-500 mt-1"><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setVideoSizeOpen(false)} className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-sm">Abbrechen</button>
              <button type="button" onClick={applyVideoSize} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm">Anwenden</button>
            </div>
          </div>
        </div>
      )}
      {/* Card Dialog */}
      {cardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) setCardOpen(false); }}>
          <div className="w-full max-w-md mx-4 p-4 rounded-xl bg-neutral-900 border border-neutral-700/40 shadow-xl space-y-3 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 font-medium">{cardEdit ? 'Card bearbeiten' : 'Card einfügen'}</h3>
              <button type="button" onClick={() => setCardOpen(false)} className="text-neutral-400 hover:text-neutral-200">✕</button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-neutral-200 text-sm">
                <input type="checkbox" checked={cardUseBg} onChange={e => setCardUseBg(e.target.checked)} />
                Hintergrundfarbe aktivieren
              </label>
              {cardUseBg && (
                <div className="space-y-3 pl-4 border-l-2 border-neutral-700/40">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-300 text-sm w-28 shrink-0">Typ</span>
                    {(['solid','linear','radial'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setCardGradientType(t)} className={`px-2 py-1 rounded text-xs border ${cardGradientType===t ? 'bg-blue-600 text-white border-blue-500' : 'border-neutral-700/40 text-neutral-300 hover:bg-neutral-800'}`}>
                        {t==='solid' ? 'Einfarbig' : t==='linear' ? 'Linear' : 'Radial'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm w-28 shrink-0">Farbe 1</span>
                    <input type="color" value={cardBg} onChange={e => setCardBg(e.target.value)} className="h-7 w-12 rounded border border-neutral-700/40 bg-neutral-900 cursor-pointer" />
                    <Input value={cardBg} onChange={e => setCardBg(e.target.value)} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm w-28 shrink-0">Deckkraft 1: {cardBgOpacity}%</span>
                    <input type="range" min="0" max="100" step="5" value={cardBgOpacity} onChange={e => setCardBgOpacity(e.target.value)} className="flex-1 accent-blue-500" />
                  </div>
                  {cardGradientType !== 'solid' && (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-300 text-sm w-28 shrink-0">Farbe 2</span>
                        <input type="color" value={cardBg2} onChange={e => setCardBg2(e.target.value)} className="h-7 w-12 rounded border border-neutral-700/40 bg-neutral-900 cursor-pointer" />
                        <Input value={cardBg2} onChange={e => setCardBg2(e.target.value)} className="flex-1" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-300 text-sm w-28 shrink-0">Deckkraft 2: {cardBg2Opacity}%</span>
                        <input type="range" min="0" max="100" step="5" value={cardBg2Opacity} onChange={e => setCardBg2Opacity(e.target.value)} className="flex-1 accent-blue-500" />
                      </div>
                    </>
                  )}
                  {cardGradientType === 'linear' && (
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-300 text-sm w-28 shrink-0">Richtung: {cardGradientDir}°</span>
                      <input type="range" min="0" max="360" step="15" value={cardGradientDir} onChange={e => setCardGradientDir(e.target.value)} className="flex-1 accent-blue-500" />
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-neutral-300 text-sm w-28 shrink-0">Breite: {cardWidth}%</span>
                <input type="range" min="50" max="100" step="5" value={cardWidth} onChange={e => setCardWidth(e.target.value)} className="flex-1 accent-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-300 text-sm w-28 shrink-0">Padding: {cardPadding}px</span>
                <input type="range" min="0" max="48" step="4" value={cardPadding} onChange={e => setCardPadding(e.target.value)} className="flex-1 accent-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-300 text-sm w-28 shrink-0">Radius: {cardBorderRadius}px</span>
                <input type="range" min="0" max="24" step="2" value={cardBorderRadius} onChange={e => setCardBorderRadius(e.target.value)} className="flex-1 accent-blue-500" />
              </div>
              <label className="flex items-center gap-2 text-neutral-200 text-sm">
                <input type="checkbox" checked={cardHasBorder} onChange={e => setCardHasBorder(e.target.checked)} />
                Rand anzeigen
              </label>
              {cardHasBorder && (
                <div className="space-y-2 pl-4 border-l-2 border-neutral-700/40">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm w-28 shrink-0">Rand-Farbe</span>
                    <input type="color" value={cardBorderColor} onChange={e => setCardBorderColor(e.target.value)} className="h-7 w-12 rounded border border-neutral-700/40 bg-neutral-900 cursor-pointer" />
                    <Input value={cardBorderColor} onChange={e => setCardBorderColor(e.target.value)} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm w-28 shrink-0">Rand-Deckkraft: {cardBorderOpacity}%</span>
                    <input type="range" min="0" max="100" step="5" value={cardBorderOpacity} onChange={e => setCardBorderOpacity(e.target.value)} className="flex-1 accent-blue-500" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm w-28 shrink-0">Rand-Stärke: {cardBorderWidth}px</span>
                    <input type="range" min="0" max="8" step="1" value={cardBorderWidth} onChange={e => setCardBorderWidth(e.target.value)} className="flex-1 accent-blue-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCardOpen(false)} className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-sm">Abbrechen</button>
              <button type="button" onClick={insertCard} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm">{cardEdit ? 'Anwenden' : 'Einfügen'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Editor Area */}
      <div className="min-h-[160px] p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/40 text-neutral-100">
        <style>{`
          .ProseMirror { outline: none; min-height: 120px; white-space: pre-wrap; }
          .ProseMirror p { margin: 0 0 0.5em 0; min-height: 0.5em; }
          .ProseMirror h1 { font-size: 1.75em; font-weight: 700; margin: 0 0 0.3em 0; }
          .ProseMirror h2 { font-size: 1.5em; font-weight: 600; margin: 0 0 0.3em 0; }
          .ProseMirror h3 { font-size: 1.25em; font-weight: 600; margin: 0 0 0.3em 0; }
          .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin: 0 0 0.5em 0; }
          .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin: 0 0 0.5em 0; }
          .ProseMirror li { margin: 0.15em 0; }
          .ProseMirror a { color: #60a5fa; text-decoration: underline; }
          .ProseMirror a.button-link { display: inline-block !important; padding: 8px 16px !important; border-radius: 6px !important; text-decoration: none !important; color: #fff !important; }
          .ProseMirror span[style*="text-transform: uppercase"] { text-transform: uppercase; }
          .ProseMirror img { max-width: 100%; height: auto; display: block; }
          .ProseMirror .ProseMirror-selectednode img { outline: 2px solid #3b82f6; outline-offset: 2px; border-radius: 4px; }
          .ProseMirror div[data-card] { margin: 0.5em auto; max-width: 100%; }
          .ProseMirror .ProseMirror-selectednode div[data-card] { outline: 2px solid #3b82f6; outline-offset: 2px; }
          .ProseMirror div[data-youtube-video] { position: relative; }
          .ProseMirror iframe { max-width: 100%; border-radius: 6px; }
          .ProseMirror .ProseMirror-selectednode div[data-youtube-video] { outline: 2px solid #3b82f6; outline-offset: 2px; border-radius: 4px; }
          .ProseMirror .image-grid { display: grid; gap: 0.5rem; margin: 0.5em 0; }
          .ProseMirror .image-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ProseMirror .image-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .ProseMirror .image-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          @media (max-width: 640px) {
            .ProseMirror .image-grid-2,
            .ProseMirror .image-grid-3,
            .ProseMirror .image-grid-4 { grid-template-columns: 1fr; }
          }
          .ProseMirror .ProseMirror-selectednode div[data-image-grid] { outline: 2px solid #3b82f6; outline-offset: 2px; border-radius: 4px; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
