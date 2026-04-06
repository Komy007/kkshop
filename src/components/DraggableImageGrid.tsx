'use client';

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, GripVertical } from 'lucide-react';

export interface DraggableImage {
    id: string;
    src: string;
    badge?: string;       // e.g. "Main · 대표", "New · 신규"
    badgeColor?: string;  // tailwind bg class
    borderColor?: string; // tailwind border class
}

interface Props {
    images: DraggableImage[];
    onReorder: (from: number, to: number) => void;
    onRemove: (index: number) => void;
    coverLabel?: string;  // label for first image badge
    layout?: 'grid3' | 'grid4' | 'flex'; // grid-cols-3, grid-cols-4, or flex-wrap
}

export default function DraggableImageGrid({ images, onReorder, onRemove, coverLabel, layout = 'grid3' }: Props) {
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || result.source.index === result.destination.index) return;
        onReorder(result.source.index, result.destination.index);
    };

    if (images.length === 0) return null;

    const containerClass = layout === 'grid4'
        ? 'grid grid-cols-4 gap-3'
        : layout === 'flex'
            ? 'flex gap-3 flex-wrap'
            : 'grid grid-cols-3 gap-3';

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="image-list" direction="horizontal">
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={containerClass}
                    >
                        {images.map((img, i) => (
                            <Draggable key={img.id} draggableId={img.id} index={i}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`relative group ${layout === 'flex' ? 'w-24 h-24' : 'aspect-square'} cursor-grab active:cursor-grabbing select-none ${snapshot.isDragging ? 'z-50 ring-2 ring-blue-400 shadow-xl opacity-90 scale-105' : ''}`}
                                        style={provided.draggableProps.style}
                                    >
                                        <img
                                            src={img.src}
                                            draggable={false}
                                            className={`w-full h-full object-cover rounded-xl border ${img.borderColor || 'border-gray-200'} pointer-events-none`}
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Error'; }}
                                        />
                                        {/* Cover / custom badge */}
                                        {i === 0 && coverLabel && (
                                            <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold pointer-events-none">
                                                🌟 {coverLabel}
                                            </span>
                                        )}
                                        {img.badge && (
                                            <span className={`absolute bottom-1 left-1 ${img.badgeColor || 'bg-black/60'} text-white text-[9px] px-1.5 py-0.5 rounded font-bold pointer-events-none`}>
                                                {img.badge}
                                            </span>
                                        )}
                                        {/* Drag hint icon — always faintly visible */}
                                        <div className="absolute top-1.5 right-7 flex items-center justify-center opacity-30 group-hover:opacity-80 transition-opacity pointer-events-none">
                                            <GripVertical className="w-4 h-4 text-white drop-shadow" />
                                        </div>
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow pointer-events-auto"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
