export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          phone?: string | null
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
        }
      }
    }
  }
} 