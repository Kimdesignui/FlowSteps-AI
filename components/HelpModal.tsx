import React from 'react';
import { IconX, IconCamera, IconWand, IconFileText, IconDownload } from './Icons';

interface HelpModalProps {
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            ?
                        </span>
                        Hướng dẫn sử dụng FlowSteps AI
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <IconX className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto p-8 space-y-8 flex-1">
                    {/* Section 1 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <IconCamera className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">1. Thu thập các bước</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Bạn có 2 cách để thêm bước vào hướng dẫn:
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><b>Chụp màn hình:</b> Nhấn nút "Chụp màn hình" để chụp trực tiếp cửa sổ ứng dụng hoặc tab trình duyệt.</li>
                                    <li><b>Tải ảnh lên:</b> Upload ảnh có sẵn từ máy tính của bạn.</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <IconWand className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">2. AI Phân tích & Viết nội dung</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Ngay khi thêm ảnh, <b>Gemini AI</b> sẽ tự động phân tích giao diện để:
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Đặt tiêu đề cho bước (Ví dụ: "Nhấn nút Đăng nhập").</li>
                                    <li>Viết mô tả chi tiết thao tác cần thực hiện.</li>
                                </ul>
                                Bạn có thể yêu cầu AI viết lại bất cứ lúc nào bằng nút "AI Viết lại".
                            </p>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <IconFileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">3. Chỉnh sửa & Chú thích</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Làm rõ hướng dẫn của bạn bằng các công cụ:
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Thêm số thứ tự, mũi tên, khung chữ nhật để làm nổi bật vùng quan trọng.</li>
                                    <li>Cắt ảnh (Crop) để loại bỏ vùng thừa.</li>
                                    <li>Kéo thả để sắp xếp lại thứ tự các bước.</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    {/* Section 4 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <IconDownload className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">4. Xuất bản</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Khi hoàn tất, nhấn <b>"Xem trước"</b> để kiểm tra lại toàn bộ tài liệu. Tại đây bạn có thể:
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Chỉnh sửa trực tiếp nội dung như trong Word.</li>
                                    <li>Xuất ra file <b>HTML</b> (để nhúng web).</li>
                                    <li>Xuất ra file <b>DOCX</b> (để chỉnh sửa trong Word).</li>
                                    <li>Sao chép toàn bộ nội dung để dán vào Google Docs/Email.</li>
                                </ul>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="btn btn-primary px-8 text-white">Đã hiểu</button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;