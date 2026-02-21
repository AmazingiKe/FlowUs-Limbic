/**
 * FlowUs Block 节点类型定义
 * 严格对齐 FlowUs API 规范
 * @see https://flowus.cn/share/07168d83-cb08-4ab8-ab73-74fe915054b1
 */

/**
 * Block 类型枚举
 */
export type BlockType =
  // 文本类
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'
  | 'quote'
  | 'callout'
  // 媒体类
  | 'image'
  | 'video'
  | 'file'
  | 'pdf'
  | 'bookmark'
  // 高级类
  | 'code'
  | 'equation'
  | 'divider'
  | 'table_of_contents'
  | 'breadcrumb'
  // 数据库类
  | 'child_page'
  | 'child_database'
  | 'embed'
  | 'link_preview'
  | 'synced_block'
  | 'table'
  | 'table_row'
  | 'column_list'
  | 'column';

/**
 * 富文本注释
 */
export interface RichTextAnnotations {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
}

/**
 * 富文本内容
 */
export interface RichTextContent {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string } | null;
  };
  mention?: {
    type: 'user' | 'page' | 'database' | 'date';
    [key: string]: any;
  };
  equation?: {
    expression: string;
  };
  annotations?: RichTextAnnotations;
  plain_text?: string;
  href?: string | null;
}

/**
 * Block 节点基础结构
 */
export interface BlockNode {
  object: 'block';
  id?: string;
  type: BlockType;
  created_time?: string;
  last_edited_time?: string;
  created_by?: { object: 'user'; id: string };
  last_edited_by?: { object: 'user'; id: string };
  has_children?: boolean;
  archived?: boolean;

  // 类型特定属性 (根据 type 动态)
  [key: string]: any;
}

/**
 * 段落 Block
 */
export interface ParagraphBlock extends BlockNode {
  type: 'paragraph';
  paragraph: {
    rich_text: RichTextContent[];
    color?: string;
  };
}

/**
 * 标题 Block
 */
export interface HeadingBlock extends BlockNode {
  type: 'heading_1' | 'heading_2' | 'heading_3';
  heading_1?: {
    rich_text: RichTextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_2?: {
    rich_text: RichTextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_3?: {
    rich_text: RichTextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
}

/**
 * 待办 Block
 */
export interface TodoBlock extends BlockNode {
  type: 'to_do';
  to_do: {
    rich_text: RichTextContent[];
    checked: boolean;
    color?: string;
  };
}

/**
 * 代码 Block
 */
export interface CodeBlock extends BlockNode {
  type: 'code';
  code: {
    rich_text: RichTextContent[];
    language: string;
    caption?: RichTextContent[];
  };
}

/**
 * 列表 Block
 */
export interface ListBlock extends BlockNode {
  type: 'bulleted_list_item' | 'numbered_list_item';
  bulleted_list_item?: {
    rich_text: RichTextContent[];
    color?: string;
  };
  numbered_list_item?: {
    rich_text: RichTextContent[];
    color?: string;
  };
}

/**
 * Callout Block
 */
export interface CalloutBlock extends BlockNode {
  type: 'callout';
  callout: {
    rich_text: RichTextContent[];
    icon?: {
      type: 'emoji' | 'external' | 'file';
      emoji?: string;
      external?: { url: string };
      file?: { url: string; expiry_time: string };
    };
    color?: string;
  };
}
