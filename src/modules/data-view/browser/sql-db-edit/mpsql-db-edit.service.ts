import { Autowired, Injectable } from '@opensumi/di';
import { IDialogService, IMessageService } from '@opensumi/ide-overlay';
import { IConnectTreeServiceToken } from '../../../open-recent';
import { ConnectTreeService } from '../../../open-recent/browser/connect-tree.service';
import { WorkbenchEditorService } from '@opensumi/ide-editor';
import { ServerInfo } from '../../../local-store-db/common';
import { CommandService, URI } from '@opensumi/ide-core-common';
import { ServerType } from '../../../base/types/server-node.types';
import {
  IPostgresRole,
  IPostgresService,
  IPostgresServiceToken,
  IQueryResult,
  IRunSqlResult,
  ISqlServerApiToken,
} from '../../../server-client/common';
import { SqlServerApiService } from '../../../server-client/browser/sql-server-api.service';
import { QueryUtil } from '../../../base/utils/query-util';
import { IBaseState } from '../../common/data-browser.types';
import { IDbDetail, SimpleName } from '../../../server-client/common';

@Injectable({ multiple: true })
export class MpsqlDbEditService {
  @Autowired(IMessageService)
  protected readonly messages: IMessageService;

  @Autowired(IDialogService)
  private readonly dialogService: IDialogService;

  @Autowired(IConnectTreeServiceToken)
  private readonly connectTreeService: ConnectTreeService;

  @Autowired(WorkbenchEditorService)
  private readonly workbenchEditorService: WorkbenchEditorService;

  //
  // @Autowired(IServerServiceToken)
  // private readonly serverService: IServerService;

  @Autowired(CommandService)
  private readonly commandService: CommandService;

  @Autowired(ISqlServerApiToken)
  protected readonly sqlServerApiService: SqlServerApiService;

  @Autowired(IPostgresServiceToken)
  private postgresService: IPostgresService;

  private openUri: URI;
  private nodePath: string;
  private server: ServerInfo;
  private database?: string;
  private nodeName?: string;
  private serverType: ServerType;

  public init(props: IBaseState) {
    //console.log('sql db edit init--->', props)
    this.openUri = props.openUri;
    this.nodePath = props.nodePath;
    this.server = props.server;
    this.serverType = props.serverType;
    this.database = props.db ? String(props.db) : '';
    this.nodeName = props.nodeName;
  }

  public async getDatabaseInfo() {
    const result = await this.sqlServerApiService.showDatabaseInfo(this.server, this.nodeName!);
    //console.log('getDatabaseInfo->', result)
    if (result.success && result.data) {
      return result.data[0];
    }
    return null;
  }

  public async saveDb(editParam: IDbDetail, isUpdate: boolean, closeTab: boolean): Promise<IQueryResult> {
    let result: IRunSqlResult[] = [];
    //console.log('saveDb--->', editParam)
    if (isUpdate) {
      result = await this.sqlServerApiService.alterDb({ server: this.server }, editParam);
    } else {
      result = await this.sqlServerApiService.createDb({ server: this.server }, editParam);
    }
    const errResult = result.filter((item) => !item.success);
    if (errResult && errResult.length > 0) {
      this.dialogService.error(QueryUtil.getErrorMessage(result[0]), ['OK']);
      return errResult[0];
    } else {
      this.messages.info(`${isUpdate ? '修改' : '保存'}成功`);
      //库名称无法修改，所以如果是库update，不需要刷新目录
      await this.connectTreeService.refreshByPathForServerNode(this.nodePath);
      if (closeTab) {
        this.workbenchEditorService.close(this.openUri, false);
      }
      return { success: true };
    }
  }

  public async getSchemaInfo() {
    const result = await this.sqlServerApiService.showSchemaInfo(
      {
        server: this.server,
        db: this.database,
      },
      this.nodeName!,
    );
    //console.log('getSchemaInfo->', result)
    if (result.success && result.data) {
      return result.data[0];
    }
    return null;
  }

  public async saveSchema(param: IDbDetail, isUpdate: boolean, closeTab: boolean): Promise<IQueryResult> {
    let result: IRunSqlResult[];
    if (isUpdate) {
      result = await this.sqlServerApiService.alterSchema({ server: this.server, db: this.database }, param);
    } else {
      result = await this.sqlServerApiService.createSchema({ server: this.server, db: this.database }, param);
    }
    const errResult = result.filter((item) => !item.success);
    if (errResult && errResult.length > 0) {
      this.dialogService.error(QueryUtil.getErrorMessage(errResult[0]), ['OK']);
      return errResult[0];
    } else {
      this.messages.info(`${isUpdate ? '修改' : '保存'}成功`);
      //库名称无法修改，所以如果是库update，不需要刷新目录
      await this.connectTreeService.refreshByPathForServerNode(this.nodePath);
      if (closeTab) {
        await this.workbenchEditorService.close(this.openUri, false);
      }
      return { success: true };
    }
  }

  public async getRoles(): Promise<string[]> {
    const result: IRunSqlResult<IPostgresRole[]> = await this.postgresService.showRoles({ server: this.server });
    if (result.success) {
      const roles = result.data?.map((item) => item.rolname!);
      if (roles) {
        return roles;
      }
    }
    return [];
  }

  public async getTablespace(): Promise<string[]> {
    const result: IRunSqlResult<SimpleName[]> = await this.postgresService.showTablespace({ server: this.server });
    if (result.success) {
      const roles = result.data?.map((item) => item.name!);
      if (roles) {
        return roles;
      }
    }
    return [];
  }

  //

  public async getTemplate(): Promise<string[]> {
    const result = await this.postgresService.showTemplate({ server: this.server });
    if (result.success) {
      const templates = result.data?.map((item) => item.name!);
      if (templates) {
        return templates;
      }
    }

    return [];
  }
}