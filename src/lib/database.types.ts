// Generated from PostgreSQL information_schema. Run npm run db:types after migrations.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Database = {
  public: {
    Tables: {
      access_attempts: {
        Row: {
          key: string;
          attempts: number;
          window_start: string;
        };
        Insert: {
          key: string;
          attempts: number;
          window_start: string;
        };
        Update: {
          key?: string;
          attempts?: number;
          window_start?: string;
        };
        Relationships: [];
      };
      access_sessions: {
        Row: {
          id: string;
          device_id: string | null;
          token_hash: string;
          created_at: string;
          expires_at: string;
          revoked_at: string | null;
          mechanic_id: string | null;
          last_seen_at: string;
          credential_version: string | null;
          elevated_until: string | null;
        };
        Insert: {
          id?: string;
          device_id?: string | null;
          token_hash: string;
          created_at?: string;
          expires_at: string;
          revoked_at?: string | null;
          mechanic_id?: string | null;
          last_seen_at?: string;
          credential_version?: string | null;
          elevated_until?: string | null;
        };
        Update: {
          id?: string;
          device_id?: string | null;
          token_hash?: string;
          created_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
          mechanic_id?: string | null;
          last_seen_at?: string;
          credential_version?: string | null;
          elevated_until?: string | null;
        };
        Relationships: [];
      };
      activity_comments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          entity: string;
          entity_id: string;
          body: string;
          mechanic_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          entity: string;
          entity_id: string;
          body: string;
          mechanic_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          entity?: string;
          entity_id?: string;
          body?: string;
          mechanic_id?: string;
        };
        Relationships: [];
      };
      aircraft: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          registration: string;
          manufacturer: string | null;
          model: string | null;
          serial_number: string | null;
          location_id: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          registration: string;
          manufacturer?: string | null;
          model?: string | null;
          serial_number?: string | null;
          location_id?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          registration?: string;
          manufacturer?: string | null;
          model?: string | null;
          serial_number?: string | null;
          location_id?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          severity: string;
          source_key: string;
          entity: string;
          entity_id: string;
          status: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          severity: string;
          source_key: string;
          entity: string;
          entity_id: string;
          status?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          severity?: string;
          source_key?: string;
          entity?: string;
          entity_id?: string;
          status?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          value: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          value: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          value?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          entity: string;
          entity_id: string | null;
          action: string;
          before_data: Json | null;
          after_data: Json | null;
          mechanic_id: string | null;
          operation_id: string | null;
          reason: string | null;
          created_at: string;
          session_id: string | null;
          device_id: string | null;
          responsavel_declarado: string | null;
          outcome: string;
          request_id: string;
        };
        Insert: {
          id?: string;
          entity: string;
          entity_id?: string | null;
          action: string;
          before_data?: Json | null;
          after_data?: Json | null;
          mechanic_id?: string | null;
          operation_id?: string | null;
          reason?: string | null;
          created_at?: string;
          session_id?: string | null;
          device_id?: string | null;
          responsavel_declarado?: string | null;
          outcome?: string;
          request_id?: string;
        };
        Update: {
          id?: string;
          entity?: string;
          entity_id?: string | null;
          action?: string;
          before_data?: Json | null;
          after_data?: Json | null;
          mechanic_id?: string | null;
          operation_id?: string | null;
          reason?: string | null;
          created_at?: string;
          session_id?: string | null;
          device_id?: string | null;
          responsavel_declarado?: string | null;
          outcome?: string;
          request_id?: string;
        };
        Relationships: [];
      };
      authorized_devices: {
        Row: {
          id: string;
          token_hash: string;
          label: string;
          created_at: string;
          expires_at: string;
          revoked_at: string | null;
          last_seen_at: string | null;
          authorization_version: number;
        };
        Insert: {
          id?: string;
          token_hash: string;
          label: string;
          created_at?: string;
          expires_at: string;
          revoked_at?: string | null;
          last_seen_at?: string | null;
          authorization_version?: number;
        };
        Update: {
          id?: string;
          token_hash?: string;
          label?: string;
          created_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
          last_seen_at?: string | null;
          authorization_version?: number;
        };
        Relationships: [];
      };
      bootstrap_uses: {
        Row: {
          token_hash: string;
          used_at: string;
        };
        Insert: {
          token_hash: string;
          used_at?: string;
        };
        Update: {
          token_hash?: string;
          used_at?: string;
        };
        Relationships: [];
      };
      confirmations: {
        Row: {
          id: string;
          session_id: string;
          mechanic_id: string;
          operation_hash: string;
          expires_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          mechanic_id: string;
          operation_hash: string;
          expires_at: string;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          mechanic_id?: string;
          operation_hash?: string;
          expires_at?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      device_challenges: {
        Row: {
          id: string;
          token_hash: string;
          browser_hash: string;
          expires_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          token_hash: string;
          browser_hash: string;
          expires_at: string;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          token_hash?: string;
          browser_hash?: string;
          expires_at?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      document_links: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          document_id: string;
          entity: string;
          entity_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          document_id: string;
          entity: string;
          entity_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          document_id?: string;
          entity?: string;
          entity_id?: string;
        };
        Relationships: [];
      };
      document_versions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          document_id: string;
          revision: number;
          object_path: string;
          mime_type: string;
          size_bytes: number;
          sha256: string;
          mechanic_id: string;
          scan_status: string;
          scanned_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          document_id: string;
          revision: number;
          object_path: string;
          mime_type: string;
          size_bytes: number;
          sha256: string;
          mechanic_id: string;
          scan_status?: string;
          scanned_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          document_id?: string;
          revision?: number;
          object_path?: string;
          mime_type?: string;
          size_bytes?: number;
          sha256?: string;
          mechanic_id?: string;
          scan_status?: string;
          scanned_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          category: string;
          reference_url: string | null;
          notes: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          category: string;
          reference_url?: string | null;
          notes?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          category?: string;
          reference_url?: string | null;
          notes?: string | null;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          alert_id: string;
          recipient_id: string;
          dedup_key: string;
          status: string;
          attempts: number;
          next_attempt_at: string;
          lease_until: string | null;
          provider_id: string | null;
          last_error: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          alert_id: string;
          recipient_id: string;
          dedup_key: string;
          status?: string;
          attempts?: number;
          next_attempt_at?: string;
          lease_until?: string | null;
          provider_id?: string | null;
          last_error?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          alert_id?: string;
          recipient_id?: string;
          dedup_key?: string;
          status?: string;
          attempts?: number;
          next_attempt_at?: string;
          lease_until?: string | null;
          provider_id?: string | null;
          last_error?: string | null;
        };
        Relationships: [];
      };
      external_shipment_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          shipment_id: string;
          lot_id: string | null;
          part_instance_id: string | null;
          quantity: number;
          returned_quantity: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          shipment_id: string;
          lot_id?: string | null;
          part_instance_id?: string | null;
          quantity: number;
          returned_quantity?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          shipment_id?: string;
          lot_id?: string | null;
          part_instance_id?: string | null;
          quantity?: number;
          returned_quantity?: number;
        };
        Relationships: [];
      };
      external_shipments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          recipient_id: string;
          purpose: string;
          tracking_code: string | null;
          carrier: string | null;
          expected_return: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          recipient_id: string;
          purpose: string;
          tracking_code?: string | null;
          carrier?: string | null;
          expected_return?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          recipient_id?: string;
          purpose?: string;
          tracking_code?: string | null;
          carrier?: string | null;
          expected_return?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      external_tracking_events: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          shipment_id: string;
          name: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          shipment_id: string;
          name: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          shipment_id?: string;
          name?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      import_job_rows: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          job_id: string;
          row_number: number;
          data: Json;
          error: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          job_id: string;
          row_number: number;
          data: Json;
          error?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          job_id?: string;
          row_number?: number;
          data?: Json;
          error?: string | null;
        };
        Relationships: [];
      };
      import_jobs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          category: string;
          total_rows: number;
          success_rows: number;
          error_rows: number;
          status: string;
          mechanic_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          category: string;
          total_rows: number;
          success_rows?: number;
          error_rows?: number;
          status?: string;
          mechanic_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          category?: string;
          total_rows?: number;
          success_rows?: number;
          error_rows?: number;
          status?: string;
          mechanic_id?: string | null;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          code: string;
          parent_id: string | null;
          kind: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          code: string;
          parent_id?: string | null;
          kind?: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          code?: string;
          parent_id?: string | null;
          kind?: string;
          active?: boolean;
        };
        Relationships: [];
      };
      maintenance_tasks: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          description: string | null;
          aircraft_id: string | null;
          work_order_id: string | null;
          mechanic_id: string | null;
          priority: string;
          status: string;
          due_at: string | null;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          description?: string | null;
          aircraft_id?: string | null;
          work_order_id?: string | null;
          mechanic_id?: string | null;
          priority?: string;
          status?: string;
          due_at?: string | null;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          description?: string | null;
          aircraft_id?: string | null;
          work_order_id?: string | null;
          mechanic_id?: string | null;
          priority?: string;
          status?: string;
          due_at?: string | null;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      mechanics: {
        Row: {
          id: string;
          name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          id?: string;
          name?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      notification_recipients: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          email: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          email: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          email?: string;
          active?: boolean;
        };
        Relationships: [];
      };
      notification_rules: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          enabled: boolean;
          days_before: number;
          email_enabled: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          enabled?: boolean;
          days_before?: number;
          email_enabled?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          enabled?: boolean;
          days_before?: number;
          email_enabled?: boolean;
        };
        Relationships: [];
      };
      operation_results: {
        Row: {
          id: string;
          session_id: string;
          operation_hash: string;
          result: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          operation_hash: string;
          result: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          operation_hash?: string;
          result?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          kind: string;
          email: string | null;
          phone: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          kind: string;
          email?: string | null;
          phone?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          kind?: string;
          email?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      part_catalog: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          part_number: string;
          manufacturer: string | null;
          category: string | null;
          unit: string;
          minimum_stock: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          part_number: string;
          manufacturer?: string | null;
          category?: string | null;
          unit?: string;
          minimum_stock?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          part_number?: string;
          manufacturer?: string | null;
          category?: string | null;
          unit?: string;
          minimum_stock?: number;
        };
        Relationships: [];
      };
      part_instances: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          catalog_id: string;
          serial_number: string;
          owner_id: string | null;
          location_id: string | null;
          aircraft_id: string | null;
          position: string | null;
          condition: string;
          documentation: string;
          logistics: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          catalog_id: string;
          serial_number: string;
          owner_id?: string | null;
          location_id?: string | null;
          aircraft_id?: string | null;
          position?: string | null;
          condition?: string;
          documentation?: string;
          logistics?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          catalog_id?: string;
          serial_number?: string;
          owner_id?: string | null;
          location_id?: string | null;
          aircraft_id?: string | null;
          position?: string | null;
          condition?: string;
          documentation?: string;
          logistics?: string;
        };
        Relationships: [];
      };
      physical_count_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          count_id: string;
          lot_id: string;
          expected: number;
          counted: number;
          reconciled: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          count_id: string;
          lot_id: string;
          expected: number;
          counted: number;
          reconciled?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          count_id?: string;
          lot_id?: string;
          expected?: number;
          counted?: number;
          reconciled?: boolean;
        };
        Relationships: [];
      };
      physical_counts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          location_id: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          location_id: string;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          location_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      stock_lots: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          catalog_id: string;
          code: string;
          location_id: string;
          owner_id: string | null;
          supplier_id: string | null;
          quantity: number;
          reserved: number;
          expires_at: string | null;
          opened_at: string | null;
          condition: string;
          documentation: string;
          unit_cost: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          catalog_id: string;
          code: string;
          location_id: string;
          owner_id?: string | null;
          supplier_id?: string | null;
          quantity?: number;
          reserved?: number;
          expires_at?: string | null;
          opened_at?: string | null;
          condition?: string;
          documentation?: string;
          unit_cost?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          catalog_id?: string;
          code?: string;
          location_id?: string;
          owner_id?: string | null;
          supplier_id?: string | null;
          quantity?: number;
          reserved?: number;
          expires_at?: string | null;
          opened_at?: string | null;
          condition?: string;
          documentation?: string;
          unit_cost?: number | null;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          lot_id: string;
          kind: string;
          quantity: number;
          destination_id: string | null;
          reason: string;
          operation_id: string;
          reservation_id: string | null;
          task_id: string | null;
          work_order_id: string | null;
          aircraft_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          lot_id: string;
          kind: string;
          quantity: number;
          destination_id?: string | null;
          reason: string;
          operation_id: string;
          reservation_id?: string | null;
          task_id?: string | null;
          work_order_id?: string | null;
          aircraft_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          lot_id?: string;
          kind?: string;
          quantity?: number;
          destination_id?: string | null;
          reason?: string;
          operation_id?: string;
          reservation_id?: string | null;
          task_id?: string | null;
          work_order_id?: string | null;
          aircraft_id?: string | null;
        };
        Relationships: [];
      };
      stock_reservations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          lot_id: string;
          quantity: number;
          status: string;
          purpose: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          lot_id: string;
          quantity: number;
          status?: string;
          purpose: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          lot_id?: string;
          quantity?: number;
          status?: string;
          purpose?: string;
        };
        Relationships: [];
      };
      tool_calibrations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          tool_id: string;
          performed_at: string;
          due_at: string;
          result: string;
          certificate_reference: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id: string;
          performed_at: string;
          due_at: string;
          result: string;
          certificate_reference: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id?: string;
          performed_at?: string;
          due_at?: string;
          result?: string;
          certificate_reference?: string;
        };
        Relationships: [];
      };
      tool_checkouts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          tool_id: string;
          mechanic_id: string;
          destination: string;
          aircraft_id: string | null;
          task_id: string | null;
          work_order_id: string | null;
          due_at: string | null;
          returned_at: string | null;
          return_condition: string | null;
          return_location_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id: string;
          mechanic_id: string;
          destination: string;
          aircraft_id?: string | null;
          task_id?: string | null;
          work_order_id?: string | null;
          due_at?: string | null;
          returned_at?: string | null;
          return_condition?: string | null;
          return_location_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id?: string;
          mechanic_id?: string;
          destination?: string;
          aircraft_id?: string | null;
          task_id?: string | null;
          work_order_id?: string | null;
          due_at?: string | null;
          returned_at?: string | null;
          return_condition?: string | null;
          return_location_id?: string | null;
        };
        Relationships: [];
      };
      tool_discrepancies: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          tool_id: string;
          name: string;
          aircraft_id: string | null;
          task_id: string | null;
          status: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id: string;
          name: string;
          aircraft_id?: string | null;
          task_id?: string | null;
          status?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id?: string;
          name?: string;
          aircraft_id?: string | null;
          task_id?: string | null;
          status?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      tool_inspections: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          tool_id: string | null;
          kit_id: string | null;
          name: string;
          notes: string | null;
          status: string;
          aircraft_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id?: string | null;
          kit_id?: string | null;
          name: string;
          notes?: string | null;
          status: string;
          aircraft_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          tool_id?: string | null;
          kit_id?: string | null;
          name?: string;
          notes?: string | null;
          status?: string;
          aircraft_id?: string | null;
        };
        Relationships: [];
      };
      tool_kit_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          kit_id: string;
          tool_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          kit_id: string;
          tool_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          kit_id?: string;
          tool_id?: string;
        };
        Relationships: [];
      };
      tool_kits: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          code: string;
          require_check: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          code: string;
          require_check?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          code?: string;
          require_check?: boolean;
        };
        Relationships: [];
      };
      tools: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          name: string;
          code: string;
          brand: string | null;
          model: string | null;
          serial_number: string | null;
          owner_id: string | null;
          location_id: string;
          status: string;
          calibration_required: boolean;
          calibration_due: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name: string;
          code: string;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          owner_id?: string | null;
          location_id: string;
          status?: string;
          calibration_required?: boolean;
          calibration_due?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          name?: string;
          code?: string;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          owner_id?: string | null;
          location_id?: string;
          status?: string;
          calibration_required?: boolean;
          calibration_due?: string | null;
        };
        Relationships: [];
      };
      work_orders: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
          archived_at: string | null;
          number: number;
          name: string;
          description: string | null;
          aircraft_id: string | null;
          mechanic_id: string | null;
          priority: string;
          status: string;
          due_at: string | null;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          number?: number;
          name: string;
          description?: string | null;
          aircraft_id?: string | null;
          mechanic_id?: string | null;
          priority?: string;
          status?: string;
          due_at?: string | null;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          archived_at?: string | null;
          number?: number;
          name?: string;
          description?: string | null;
          aircraft_id?: string | null;
          mechanic_id?: string | null;
          priority?: string;
          status?: string;
          due_at?: string | null;
          closed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      run_operation: {
        Args: {
          p_session: string;
          p_confirmation: string;
          p_operation: string;
          p_hash: string;
          p_command: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
