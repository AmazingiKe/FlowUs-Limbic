/**
 * 通用实体类型定义
 */
export type EntityType = string;
/**
 * 通用实体接口
 * 所有可同步的数据类型必须实现此接口
 */
export interface IUniversalEntity {
    id: string;
    type: EntityType;
    createdAt: string;
    updatedAt: string;
    deleted?: boolean;
    properties: Record<string, any>;
    content?: any[];
}
/**
 * FlowUs 属性类型
 */
export type FlowUsPropertyType = 'title' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone_number' | 'formula' | 'relation' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by';
/**
 * 属性定义
 */
export interface PropertyDefinition {
    name: string;
    flowusType: FlowUsPropertyType;
    required: boolean;
    mapTo: string;
    defaultValue?: any;
    options?: string[];
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
    type: EntityType;
    displayName: string;
    description?: string;
    properties: PropertyDefinition[];
    toBlocks: (entity: T) => any[];
    fromBlocks: (blocks: any[], metadata?: any) => T;
    getFingerprint: (entity: T) => string;
    validate?: (entity: T) => ValidationResult;
}
//# sourceMappingURL=entity.d.ts.map