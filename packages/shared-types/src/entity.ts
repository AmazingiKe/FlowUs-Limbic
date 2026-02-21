/**
 * 通用实体类型定义
 */

export type EntityType = string;

/**
 * 通用实体接口
 * 所有可同步的数据类型必须实现此接口
 */
export interface IUniversalEntity {
  id: string;                      // 全局唯一标识符
  type: EntityType;                // 实体类型标识
  createdAt: string;               // ISO 8601 格式创建时间
  updatedAt: string;               // ISO 8601 格式更新时间
  deleted?: boolean;               // 软删除标记
  properties: Record<string, any>; // 业务属性
  content?: any[];                 // 富文本内容 (可选)
}

/**
 * FlowUs 属性类型
 */
export type FlowUsPropertyType =
  | 'title'              // 标题 (每个 Database 必须有一个)
  | 'rich_text'          // 富文本
  | 'number'             // 数字
  | 'select'             // 单选
  | 'multi_select'       // 多选
  | 'date'               // 日期
  | 'checkbox'           // 复选框
  | 'url'                // URL
  | 'email'              // 邮箱
  | 'phone_number'       // 电话
  | 'formula'            // 公式
  | 'relation'           // 关联
  | 'rollup'             // 汇总
  | 'created_time'       // 创建时间
  | 'created_by'         // 创建人
  | 'last_edited_time'   // 最后编辑时间
  | 'last_edited_by';    // 最后编辑人

/**
 * 属性定义
 */
export interface PropertyDefinition {
  name: string;                    // 属性名称 (FlowUs 中显示)
  flowusType: FlowUsPropertyType;  // FlowUs 属性类型
  required: boolean;               // 是否必填
  mapTo: string;                   // 映射到实体的字段路径
  defaultValue?: any;              // 默认值
  options?: string[];              // select/multi_select 的选项
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * 实体 Schema
 */
export interface EntitySchema<T extends IUniversalEntity = IUniversalEntity> {
  type: EntityType;                // 实体类型标识
  displayName: string;             // 显示名称
  description?: string;            // 描述
  properties: PropertyDefinition[]; // 属性定义

  // 转换函数
  toBlocks: (entity: T) => any[];
  fromBlocks: (blocks: any[], metadata?: any) => T;

  // 变更检测
  getFingerprint: (entity: T) => string;

  // 验证
  validate?: (entity: T) => ValidationResult;
}
