import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import StockCard from '../StockCard/StockCard';
import './Dashboard.css';

function Dashboard({ stocks, onDeleteStock, onReorderStocks }) {
  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(stocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderStocks(items);
  };

  return (
    <div className="dashboard">
      <h2>Your Stocks</h2>
      {stocks.length === 0 ? (
        <p>You haven't added any stocks yet. Add some stocks to get started!</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="stock-list">
            {(provided) => (
              <div className="stock-list" {...provided.droppableProps} ref={provided.innerRef}>
                {stocks.map((stock, index) => (
                  <Draggable key={stock.id} draggableId={stock.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <StockCard stock={stock} onDelete={() => onDeleteStock(stock.id)} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

export default Dashboard;

