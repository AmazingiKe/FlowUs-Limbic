/**
 * FlowUs Database API 客户端
 * 职责: 封装 Database 查询和操作
 */

import { AxiosInstance } from 'axios';
import { BlockNode } from '@flowus-limbic/shared-types';
import { FlowUsPage } from './page-client';

/**
 * Database 查询过滤器
 */
export interface DatabaseQueryFilter {
  property: string;
  [key: string]: any;
}

/**
 * Database 查询排序
 */
export interface DatabaseQuerySort {
  property: string;
  direction: 'ascending' | 'descending';
}

/**
 * Database 查询结果
 */
export interface DatabaseQueryResult {
  results: FlowUsPage[];
  has_more: boolean;
  next_cursor?: string;
}

export class FlowUsDatabaseClient {
  constructor(private http: AxiosInstance) {}

  /**
   * 获取 Database 结构
   */
  async getDatabase(databaseId: string): Promise<any> {
    const response = await this.http.get(`/databases/${databaseId}`);
    return response.data;
  }

  /**
   * 查询 Database 条目
   */
  async queryDatabase(params: {
    databaseId: string;
    filter?: DatabaseQueryFilter;
    sorts?: DatabaseQuerySort[];
    startCursor?: string;
    pageSize?: number;
  }): Promise<DatabaseQueryResult> {
    const response = await this.http.post(
      `/databases/${params.databaseId}/query`,
      {
        filter: params.filter,
        sorts: params.sorts,
        start_cursor: params.startCursor,
        page_size: params.pageSize || 100
      }
    );

    return response.data;
  }

  /**
   * 查询所有条目 (自动处理分页)
   */
  async queryAllPages(params: {
    databaseId: string;
    filter?: DatabaseQueryFilter;
    sorts?: DatabaseQuerySort[];
  }): Promise<FlowUsPage[]> {
    let allPages: FlowUsPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const result = await this.queryDatabase({
        ...params,
        startCursor
      });

      allPages = allPages.concat(result.results);
      hasMore = result.has_more;
      startCursor = result.next_cursor;
    }

    return allPages;
  }

  /**
   * 创建 Database 条目 (实际是创建 Page)
   */
  async createDatabasePage(
    databaseId: string,
    properties: Record<string, any>,
    children?: BlockNode[]
  ): Promise<FlowUsPage> {
    const response = await this.http.post('/pages', {
      parent: { database_id: databaseId },
      properties,
      children
    });
    return response.data;
  }
}
