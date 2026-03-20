
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage = 10 }: PaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems || totalPages * itemsPerPage);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
            <div className="text-sm text-gray-500 font-medium order-2 sm:order-1">
                Showing <span className="text-gray-900 font-bold">{startItem}</span> to <span className="text-gray-900 font-bold">{endItem}</span> {totalItems && <>of <span className="text-gray-900 font-bold">{totalItems}</span></>} results
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border-2 border-gray-100 hover:border-gray-200 disabled:opacity-50 disabled:hover:border-gray-100 transition-all bg-white shadow-sm"
                >
                    <ChevronLeft size={20} className="text-gray-600" />
                </button>

                <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-600 border-2 border-gray-50 hover:border-gray-100'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border-2 border-gray-100 hover:border-gray-200 disabled:opacity-50 disabled:hover:border-gray-100 transition-all bg-white shadow-sm"
                >
                    <ChevronRight size={20} className="text-gray-600" />
                </button>
            </div>
        </div>
    );
}
