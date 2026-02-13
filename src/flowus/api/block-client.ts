/**
 * FlowUs Block API 客户端
 * 职责: 封装 Block 相关的 CRUD 操作
 * @see https://flowus.cn/share/07168d83-cb08-4ab8-ab73-74fe915054b1
 */

import { AxiosInstance } from 'axios';
import { BlockNode } from '@flowus-limbic/shared-types';

export class FlowUsBlockClient {
  constructor(private http: AxiosInstance) {}

  /**
   * 获取 Block 详情
   */
  async getBlock(blockId: string): Promise<BlockNode> {
    const response = await this.http.get(`/blocks/${blockId}`);
    const block = response.data;

    // 递归获取子 Block
    if (block.has_children) {
      block.children = await this.getChildren(blockId);
    }

    return block;
  }

  /**
   * 获取 Block 的子 Block 列表
   */
  async getChildren(
    blockId: string,
    options?: {
      startCursor?: string;
      pageSize?: number;
    }
  ): Promise<BlockNode[]> {
    const response = await this.http.get(`/blocks/${blockId}/children`, {
      params: {
        start_cursor: options?.startCursor,
        page_size: options?.pageSize || 100
      }
    });

    let results = response.data.results;

    // 处理分页
    if (response.data.has_more && response.data.next_cursor) {
      const nextPage = await this.getChildren(blockId, {
        startCursor: response.data.next_cursor,
        pageSize: options?.pageSize
      });
      results = results.concat(nextPage);
    }

    return results;
  }

  /**
   * 追加子 Block
   */
  async appendChildren(
    blockId: string,
    children: BlockNode[]
  ): Promise<{ results: BlockNode[] }> {
    const response = await this.http.patch(`/blocks/${blockId}/children`, {
      children
    });
    return response.data;
  }

  /**
   * 更新 Block
   */
  async updateBlock(
    blockId: string,
    block: Partial<BlockNode>
  ): Promise<BlockNode> {
    const response = await this.http.patch(`/blocks/${blockId}`, block);
    return response.data;
  }

  /**
   * 删除 Block
   */
  async deleteBlock(blockId: string): Promise<void> {
    await this.http.delete(`/blocks/${blockId}`);
  }
}
