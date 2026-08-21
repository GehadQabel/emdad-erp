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
      profiles: {
        Row: {
          id: string
          auth_user_id: string
          full_name: string
          email: string
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      roles: {
        Row: {
          id: string
          code: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'PURCHASING' | 'FINANCE'
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
      }
      permissions: {
        Row: {
          id: string
          code: string
          module: string
          description: string | null
          created_at: string
        }
      }
      categories: {
        Row: {
          id: string
          code: string
          name: string
          is_active: boolean
          created_at: string
        }
      }
      brands: {
        Row: {
          id: string
          code: string
          name: string
          is_active: boolean
          created_at: string
        }
      }
      units: {
        Row: {
          id: string
          code: string
          name: string
          is_active: boolean
          created_at: string
        }
      }
      products: {
        Row: {
          id: string
          product_code: string
          barcode: string | null
          name: string
          category_id: string
          brand_id: string
          unit_id: string
          base_selling_price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      warehouses: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          is_active: boolean
          created_at: string
        }
      }
      inventory_balances: {
        Row: {
          id: string
          product_id: string
          warehouse_id: string
          on_hand_qty: number
          reserved_qty: number
          updated_at: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          product_id: string
          warehouse_id: string
          transaction_type: 'OPENING_BALANCE' | 'PURCHASE_RECEIPT' | 'SALE' | 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT'
          quantity: number
          polymorphic_ref_type: string | null
          polymorphic_ref_id: string | null
          created_by: string
          notes: string | null
          created_at: string
        }
      }
      customers: {
        Row: {
          id: string
          code: string
          name: string
          contact_person: string | null
          phone: string
          email: string | null
          tax_number: string | null
          customer_type: 'CASH' | 'CREDIT'
          credit_limit: number
          payment_terms_days: number
          is_active: boolean
          created_at: string
        }
      }
      sales_orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          customer_location_id: string
          warehouse_id: string
          status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PREPARING' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
          subtotal_amount: number
          discount_percentage: number
          discount_amount: number
          total_amount: number
          payment_type: 'CASH' | 'CREDIT'
          created_by: string
          approved_at: string | null
          delivered_at: string | null
          created_at: string
        }
      }
      sales_order_items: {
        Row: {
          id: string
          sales_order_id: string
          product_id: string
          ordered_qty: number
          unit_price: number
          line_discount_percentage: number
          line_total: number
        }
      }
      purchase_orders: {
        Row: {
          id: string
          po_number: string
          supplier_id: string
          warehouse_id: string
          status: 'DRAFT' | 'OPEN' | 'CANCELLED'
          total_amount: number
          expected_delivery_date: string | null
          created_by: string
          created_at: string
        }
      }
      customer_receivables: {
        Row: {
          id: string
          receivable_number: string
          customer_id: string
          sales_order_id: string
          original_amount: number
          due_date: string
          created_at: string
        }
      }
      payments: {
        Row: {
          id: string
          payment_number: string
          customer_id: string
          payment_amount: number
          payment_date: string
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD' | 'OTHER'
          payment_reference: string | null
          recorded_by: string
          created_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_profile_id: string
          notification_type: 'LOW_STOCK' | 'APPROVAL_REQUIRED' | 'CUSTOMER_OVERDUE' | 'LATE_PO' | 'CUSTOMER_BLOCKED'
          title: string
          message: string
          polymorphic_ref_type: string | null
          polymorphic_ref_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
      }
    }
    Views: {
      v_products: {
        Row: {
          id: string
          product_code: string
          barcode: string | null
          name: string
          category_id: string
          brand_id: string
          unit_id: string
          base_selling_price: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      v_supplier_products: {
        Row: {
          id: string
          supplier_id: string
          product_id: string
          supplier_product_code: string | null
          last_purchase_price: number | null
          is_preferred: boolean
          updated_at: string
        }
      }
    }
    Functions: {
      current_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      has_permission: {
        Args: { p_permission_code: string }
        Returns: boolean
      }
      rpc_sales_order_create: {
        Args: {
          p_customer_id: string
          p_customer_location_id: string
          p_warehouse_id: string
          p_payment_type: string
          p_discount_percentage: number
          p_items: Json
        }
        Returns: string
      }
      rpc_sales_order_deliver: {
        Args: { p_sales_order_id: string }
        Returns: string
      }
      rpc_purchase_order_create: {
        Args: {
          p_supplier_id: string
          p_warehouse_id: string
          p_expected_delivery_date: string
          p_items: Json
        }
        Returns: string
      }
      rpc_goods_receipt_create_and_confirm: {
        Args: {
          p_purchase_order_id: string
          p_warehouse_id: string
          p_supplier_delivery_note: string
          p_items: Json
        }
        Returns: string
      }
      rpc_payment_record_and_allocate: {
        Args: {
          p_customer_id: string
          p_payment_amount: number
          p_payment_date: string
          p_payment_method: string
          p_payment_reference: string
          p_allocations: Json
        }
        Returns: string
      }
      rpc_sales_return_confirm: {
        Args: {
          p_sales_order_id: string
          p_reason: string
          p_items: Json
        }
        Returns: string
      }
      rpc_customer_unblock: {
        Args: {
          p_customer_id: string
          p_unblock_reason: string
        }
        Returns: void
      }
    }
  }
}
