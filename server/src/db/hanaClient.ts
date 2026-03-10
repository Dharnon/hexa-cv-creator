type HanaModule = typeof import('@sap/hana-client');

export class HanaClient {
  private available = false;
  private failureReason: string | null = null;
  private hanaModule: HanaModule | null = null;

  private get connectionParams() {
    return {
      serverNode: `${process.env.HANA_HOST ?? ''}:${process.env.HANA_PORT ?? ''}`,
      uid: process.env.HANA_USER,
      pwd: process.env.HANA_PASSWORD,
      databaseName: process.env.HANA_DATABASE,
    };
  }

  private async loadClient(): Promise<HanaModule> {
    if (!this.hanaModule) {
      this.hanaModule = await import('@sap/hana-client');
    }

    return this.hanaModule;
  }

  public isConfigured(): boolean {
    return Boolean(
      process.env.HANA_HOST &&
        process.env.HANA_PORT &&
        process.env.HANA_USER &&
        process.env.HANA_PASSWORD,
    );
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public getFailureReason(): string | null {
    return this.failureReason;
  }

  public async connect(): Promise<void> {
    if (!this.isConfigured()) {
      this.available = false;
      this.failureReason = 'SAP HANA is not configured.';
      console.warn('[hana] No credentials configured. Server will run without SAP access.');
      return;
    }

    const hana = await this.loadClient();

    await new Promise<void>((resolve, reject) => {
      const conn = hana.createConnection();
      conn.connect(this.connectionParams, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        conn.disconnect(() => resolve());
      });
    });

    this.available = true;
    this.failureReason = null;
    console.log('[hana] Connection test successful.');
  }

  public markUnavailable(reason: unknown): void {
    this.available = false;
    this.failureReason = reason instanceof Error ? reason.message : String(reason);
  }

  public async execute<T = unknown>(sql: string, params: Array<string | number> = []): Promise<T[]> {
    if (!this.isConfigured()) {
      throw new Error(this.failureReason ?? 'SAP HANA is not configured.');
    }

    const hana = await this.loadClient();

    return new Promise((resolve, reject) => {
      const conn = hana.createConnection();
      conn.connect(this.connectionParams, (connectionError: Error | null) => {
        if (connectionError) {
          this.markUnavailable(connectionError);
          reject(connectionError);
          return;
        }

        conn.exec(sql, params as any, (queryError: Error | null, rows?: T[]) => {
          conn.disconnect(() => {
            if (queryError) {
              this.markUnavailable(queryError);
              reject(queryError);
              return;
            }

            this.available = true;
            this.failureReason = null;
            resolve(rows ?? []);
          });
        });
      });
    });
  }
}

export const db = new HanaClient();
