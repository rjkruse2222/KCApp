import * as SQLite from 'expo-sqlite';
import { Client, TimeEntry, MileageEntry, Vehicle, EmbeddedReport, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'kcapp.db';

class DatabaseServiceClass {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      -- Clients table
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        isActive INTEGER DEFAULT 1,
        oneDriveFolderId TEXT,
        oneDriveFolderUrl TEXT,
        googleDriveFolderId TEXT,
        googleDriveFolderUrl TEXT,
        reportUrl TEXT,
        reportType TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Time entries table
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        clientId TEXT NOT NULL,
        description TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        durationMinutes INTEGER,
        billable INTEGER DEFAULT 1,
        hourlyRate REAL,
        notes TEXT,
        tags TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
      );

      -- Mileage entries table
      CREATE TABLE IF NOT EXISTS mileage_entries (
        id TEXT PRIMARY KEY,
        clientId TEXT,
        description TEXT NOT NULL,
        startLocation TEXT NOT NULL,
        endLocation TEXT,
        waypoints TEXT,
        distanceMiles REAL NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        purpose TEXT NOT NULL,
        vehicleId TEXT,
        reimbursementRate REAL NOT NULL,
        notes TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
        FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE SET NULL
      );

      -- Vehicles table
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        make TEXT,
        model TEXT,
        year INTEGER,
        licensePlate TEXT,
        isDefault INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      -- Embedded reports table
      CREATE TABLE IF NOT EXISTS embedded_reports (
        id TEXT PRIMARY KEY,
        clientId TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
      );

      -- App settings table
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_time_entries_clientId ON time_entries(clientId);
      CREATE INDEX IF NOT EXISTS idx_time_entries_startTime ON time_entries(startTime);
      CREATE INDEX IF NOT EXISTS idx_mileage_entries_clientId ON mileage_entries(clientId);
      CREATE INDEX IF NOT EXISTS idx_mileage_entries_startTime ON mileage_entries(startTime);
    `);
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.getAllAsync<any>('SELECT * FROM clients ORDER BY name');
    return rows.map((row) => ({
      ...row,
      isActive: Boolean(row.isActive),
    }));
  }

  async getClientById(id: string): Promise<Client | null> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.db.getFirstAsync<any>('SELECT * FROM clients WHERE id = ?', [id]);
    if (!row) return null;
    return { ...row, isActive: Boolean(row.isActive) };
  }

  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    const newClient: Client = {
      ...client,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    await this.db.runAsync(
      `INSERT INTO clients (id, name, email, phone, address, notes, isActive,
       oneDriveFolderId, oneDriveFolderUrl, googleDriveFolderId, googleDriveFolderUrl,
       reportUrl, reportType, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newClient.id,
        newClient.name,
        newClient.email || null,
        newClient.phone || null,
        newClient.address || null,
        newClient.notes || null,
        newClient.isActive ? 1 : 0,
        newClient.oneDriveFolderId || null,
        newClient.oneDriveFolderUrl || null,
        newClient.googleDriveFolderId || null,
        newClient.googleDriveFolderUrl || null,
        newClient.reportUrl || null,
        newClient.reportType || null,
        newClient.createdAt,
        newClient.updatedAt,
      ]
    );

    return newClient;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(key === 'isActive' ? (value ? 1 : 0) : value);
      }
    });

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.runAsync(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteClient(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
  }

  // Time entry operations
  async getTimeEntries(clientId?: string): Promise<TimeEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    let query = 'SELECT * FROM time_entries';
    const params: string[] = [];

    if (clientId) {
      query += ' WHERE clientId = ?';
      params.push(clientId);
    }

    query += ' ORDER BY startTime DESC';

    const rows = await this.db.getAllAsync<any>(query, params);
    return rows.map((row) => ({
      ...row,
      billable: Boolean(row.billable),
      tags: row.tags ? JSON.parse(row.tags) : undefined,
    }));
  }

  async createTimeEntry(entry: TimeEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      `INSERT INTO time_entries (id, clientId, description, startTime, endTime,
       durationMinutes, billable, hourlyRate, notes, tags, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.clientId,
        entry.description,
        entry.startTime,
        entry.endTime || null,
        entry.durationMinutes || null,
        entry.billable ? 1 : 0,
        entry.hourlyRate || null,
        entry.notes || null,
        entry.tags ? JSON.stringify(entry.tags) : null,
        entry.status,
        entry.createdAt,
        entry.updatedAt,
      ]
    );
  }

  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        if (key === 'billable') {
          values.push(value ? 1 : 0);
        } else if (key === 'tags') {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value ?? null);
        }
      }
    });

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.runAsync(
      `UPDATE time_entries SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteTimeEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM time_entries WHERE id = ?', [id]);
  }

  // Mileage entry operations
  async getMileageEntries(clientId?: string): Promise<MileageEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    let query = 'SELECT * FROM mileage_entries';
    const params: string[] = [];

    if (clientId) {
      query += ' WHERE clientId = ?';
      params.push(clientId);
    }

    query += ' ORDER BY startTime DESC';

    const rows = await this.db.getAllAsync<any>(query, params);
    return rows.map((row) => ({
      ...row,
      startLocation: JSON.parse(row.startLocation),
      endLocation: row.endLocation ? JSON.parse(row.endLocation) : undefined,
      waypoints: row.waypoints ? JSON.parse(row.waypoints) : undefined,
    }));
  }

  async createMileageEntry(entry: MileageEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      `INSERT INTO mileage_entries (id, clientId, description, startLocation, endLocation,
       waypoints, distanceMiles, startTime, endTime, purpose, vehicleId, reimbursementRate,
       notes, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.clientId || null,
        entry.description,
        JSON.stringify(entry.startLocation),
        entry.endLocation ? JSON.stringify(entry.endLocation) : null,
        entry.waypoints ? JSON.stringify(entry.waypoints) : null,
        entry.distanceMiles,
        entry.startTime,
        entry.endTime || null,
        entry.purpose,
        entry.vehicleId || null,
        entry.reimbursementRate,
        entry.notes || null,
        entry.status,
        entry.createdAt,
        entry.updatedAt,
      ]
    );
  }

  async updateMileageEntry(id: string, updates: Partial<MileageEntry>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        if (['startLocation', 'endLocation', 'waypoints'].includes(key)) {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value ?? null);
        }
      }
    });

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.runAsync(
      `UPDATE mileage_entries SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteMileageEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM mileage_entries WHERE id = ?', [id]);
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.getAllAsync<any>('SELECT * FROM vehicles ORDER BY name');
    return rows.map((row) => ({
      ...row,
      isDefault: Boolean(row.isDefault),
    }));
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    const newVehicle: Vehicle = {
      ...vehicle,
      id: uuidv4(),
      createdAt: now,
    };

    await this.db.runAsync(
      `INSERT INTO vehicles (id, name, make, model, year, licensePlate, isDefault, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newVehicle.id,
        newVehicle.name,
        newVehicle.make || null,
        newVehicle.model || null,
        newVehicle.year || null,
        newVehicle.licensePlate || null,
        newVehicle.isDefault ? 1 : 0,
        newVehicle.createdAt,
      ]
    );

    return newVehicle;
  }

  // Embedded reports operations
  async getReportsForClient(clientId: string): Promise<EmbeddedReport[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM embedded_reports WHERE clientId = ? AND isActive = 1',
      [clientId]
    );
    return rows.map((row) => ({
      ...row,
      isActive: Boolean(row.isActive),
    }));
  }

  async createReport(report: Omit<EmbeddedReport, 'id' | 'createdAt'>): Promise<EmbeddedReport> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    const newReport: EmbeddedReport = {
      ...report,
      id: uuidv4(),
      createdAt: now,
    };

    await this.db.runAsync(
      `INSERT INTO embedded_reports (id, clientId, name, url, type, description, isActive, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newReport.id,
        newReport.clientId,
        newReport.name,
        newReport.url,
        newReport.type,
        newReport.description || null,
        newReport.isActive ? 1 : 0,
        newReport.createdAt,
      ]
    );

    return newReport;
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      [key]
    );
    return row?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }
}

export const DatabaseService = new DatabaseServiceClass();
