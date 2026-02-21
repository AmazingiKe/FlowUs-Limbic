/**
 * FlowUs Page API 客户端
 * 职责: 封装 Page 相关操作
 */

import { AxiosInstance } from 'axios';
import { BlockNode } from '@flowus-limbic/shared-types';

/**
 * FlowUs Page 类型
 */
export interface FlowUsPage {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  properties: Record<string, any>;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace';
    database_id?: string;
    page_id?: string;
  };
  url: string;
}

export class FlowUsPageClient {
  constructor(private http: AxiosInstance) {}

  /**
   * 获取 Page 详情
   */
  async getPage(pageId: string): Promise<FlowUsPage> {
    const response = await this.http.get(`/pages/${pageId}`);
    return response.data;
  }

  /**
   * 创建 Page
   */
  async createPage(params: {
    parent: FlowUsPage['parent'];
    properties: Record<string, any>;
    children?: BlockNode[];
  }): Promise<FlowUsPage> {
    const response = await this.http.post('/pages', params);
    return response.data;
  }

  /**
   * 更新 Page 属性
   */
  async updatePage(
    pageId: string,
    properties: Record<string, any>
  ): Promise<FlowUsPage> {
    const response = await this.http.patch(`/pages/${pageId}`, {
      properties
    });
    return response.data;
  }

  /**
   * 归档 Page (软删除)
   */
  async archivePage(pageId: string): Promise<FlowUsPage> {
    const response = await this.http.patch(`/pages/${pageId}`, {
      archived: true
    });
    return response.data;
  }
}
