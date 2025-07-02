# Order Status Management System

## Overview

The NextApp Auto Parts CRM implements a comprehensive order status management system that tracks the complete lifecycle of an order from creation to completion. This document outlines the status flow, transition rules, role-based permissions, and implementation details.

## Order Status Lifecycle

### Status Flow Diagram
```
New → Pending → Processing → Picked → Dispatched → Completed
  ↓      ↓         ↓          ↓         ↓
 Hold   Hold     Hold       Hold      Hold
  ↓      ↓         ↓          ↓         ↓
Cancelled ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

### Valid Order Statuses
1. **New** - Order created, awaiting confirmation
2. **Pending** - Order confirmed, waiting for processing
3. **Processing** - Order being prepared
4. **Hold** - Order temporarily paused
5. **Picked** - Items picked from inventory
6. **Dispatched** - Order shipped/dispatched
7. **Completed** - Order delivered successfully
8. **Cancelled** - Order cancelled

### Status Transition Rules
- **From New**: Can go to Pending, Hold, or Cancelled
- **From Pending**: Can go to Processing, Hold, or Cancelled
- **From Processing**: Can go to Picked, Hold, or Cancelled
- **From Hold**: Can return to previous status or be Cancelled
- **From Picked**: Can go to Dispatched or Hold
- **From Dispatched**: Can go to Completed
- **From Completed**: Final status (no transitions)
- **From Cancelled**: Final status (no transitions)

## Role-Based Permissions

### Permission Matrix

| Feature | Super Admin | Admin | Manager | Storeman | Salesman | Retailer |
|---------|-------------|-------|---------|----------|----------|----------|
| **View Orders** | ✅ All | ✅ Company | ✅ Store | ✅ Assigned | ✅ Created | ✅ Own Only |
| **Create Orders** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Edit Orders** | ✅ | ✅ | ✅ | ❌ | ✅ Limited | ❌ |
| **Update Status** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Cancel Orders** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Pick Items** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Download Invoice** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Order Picking Workflow

### Overview
The order picking workflow is a critical part of the order fulfillment process. It allows warehouse staff (Storeman) to mark individual items as picked from inventory before updating the overall order status to "Picked".

### Process Flow
1. Order is in "Processing" status
2. Storeman views order details
3. Storeman marks individual items as picked
4. Once all items are picked, the order status can be updated to "Picked"
5. Order moves to the next stage (typically "Dispatched")

### Implementation Details

#### Item Picking Interface
- Each order item has a checkbox to mark it as picked
- Quantity controls allow for partial picking (when full quantity is unavailable)
- Rack location is displayed for easy warehouse navigation
- "Mark All as Picked" button for quick processing
- "Update to Picked" button (disabled until all items are picked)

#### Validation Rules
- All items must be marked as picked before changing order status to "Picked"
- Items can be partially picked (quantity less than ordered)
- Error message displayed if attempting to update status with unpicked items
- Visual indicators show picking progress
- Warning shown for partial picks, but status update still allowed

#### Data Structure
```typescript
interface OrderItem {
  id: number;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  picked?: boolean;  // Indicates if item has been picked
  pickedQuantity?: number;  // How many were actually picked
  rackLocation?: string;  // Location in warehouse
  part?: {
    name: string;
    category: string;
    image?: string;
  };
}
```

## Status Update Implementation

### Status Update Modal
The status update modal provides a user-friendly interface for changing order status:

1. Shows current status
2. Displays only valid status transitions
3. Requires notes for status changes
4. Validates business rules before allowing updates
5. Provides visual feedback on success/failure

### API Implementation
```typescript
async updateOrderStatus(id: number, status: string, notes?: string) {
  // Validate status transition
  const currentStatus = order.status;
  const validTransitions = getValidTransitions(currentStatus);
  
  if (!validTransitions.includes(status)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
  }
  
  // Special validation for Processing to Picked
  if (currentStatus === 'Processing' && status === 'Picked') {
    const allItemsPicked = await this.areAllItemsPicked(id);
    if (!allItemsPicked) {
      throw new Error('All items must be picked before changing status to Picked');
    }
  }
  
  // Update status in database
  const response = await this.api.patch(`/orders/${id}/status`, { 
    status,
    notes: notes || `Status updated to ${status}`
  });
  
  // Create status history entry
  await this.createStatusHistoryEntry(id, {
    status,
    notes,
    updatedBy: this.getCurrentUser().name,
    timestamp: new Date().toISOString()
  });
  
  return this.extractResponseData(response);
}
```

## UI Components

### OrderItemPicker Component
This component displays order items with checkboxes for picking:

```jsx
<OrderItemPicker 
  items={order.items} 
  onItemPick={handleItemPick} 
/>
```

### OrderStatusModal Component
This modal handles status updates with validation:

```jsx
<OrderStatusModal
  visible={showStatusModal}
  onClose={() => setShowStatusModal(false)}
  currentStatus={order.status}
  onUpdateStatus={handleUpdateStatus}
  isLoading={isUpdatingStatus}
/>
```

## Best Practices

### Status Updates
1. **Validation First**: Always validate status transitions before updating
2. **Audit Trail**: Maintain a complete history of status changes
3. **User Feedback**: Provide clear feedback on success/failure
4. **Business Rules**: Enforce business rules (e.g., all items picked)
5. **Role-Based Access**: Restrict status updates to authorized roles

### Order Picking
1. **Visual Indicators**: Clear visual feedback on picked/unpicked items
2. **Batch Operations**: Allow marking all items as picked with one action
3. **Location Information**: Display rack locations for efficient picking
4. **Validation**: Prevent status update until all items are picked
5. **Error Handling**: Clear error messages for invalid operations
6. **Partial Fulfillment**: Support picking partial quantities when full quantity is unavailable

## Future Enhancements

### Barcode Scanning
Implement barcode scanning for faster item picking:
- Scan item barcode to automatically mark as picked
- Validate scanned item against order items
- Support batch scanning for multiple quantities

### Partial Fulfillment
Support partial order fulfillment:
- Allow updating order status with some items marked as backordered
- Track partially fulfilled orders separately
- Generate backorder documentation automatically

### Mobile Optimization
Enhance mobile experience for warehouse staff:
- Offline support for picking operations
- Camera integration for barcode scanning
- Voice commands for hands-free operation

### Advanced Picking Logic
Implement smarter picking algorithms:
- Optimize picking routes based on warehouse layout
- Batch picking for multiple orders
- Priority-based picking for urgent orders

## Conclusion

The order status management system provides a robust framework for tracking the complete lifecycle of orders. The picking workflow enhances warehouse efficiency by ensuring all items are properly picked before an order moves to the next stage. This system supports the business requirements while providing flexibility for future enhancements.