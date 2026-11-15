# 🚀 Kế Hoạch Nâng Cấp Tính Năng Thông Minh — MyFinance (Phase 2)

Dưới đây là các tính năng được thiết kế sáng tạo nhằm nâng cấp MyFinance từ một web quản lý chấm công thành một **Trợ lý Tài chính & Cày cuốc Cá nhân toàn diện**.

---

## 🏆 Nhóm 1: Hiện Thực Hóa Mục Tiêu (Wishlist & Trophy Wall)

### 1.1. Nút "Mua Ngay" & "Bức Tường Thành Tựu" (Achievement Wall)
- **Cơ chế**: Khi một món đồ đạt 100% (hoặc bạn muốn mua ngay), có nút **"🛍️ Rước về ngay"**.
- **Mô phỏng an toàn**: Trước khi mua, hiển thị cảnh báo:
  - *"Sau khi mua món này, ví bạn còn lại: **X ₫**. Bạn có chắc chắn muốn mua?"*
- **Khi ấn Xác nhận**:
  - Tự động trừ tiền trong ví và lưu giao dịch chi tiêu.
  - Chuyển món đồ sang tab **"Đã Sở Hữu" (Trophy Wall)** kèm thống kê ý nghĩa:
    - *"Bạn đã cày cuốc tổng cộng **142 giờ làm việc** để rước em này về!"*
    - Hiển thị ngày sở hữu làm kỷ niệm.

### 1.2. Hũ Tiết Kiệm Riêng (Dedicated Piggy Bank)
- Thay vì tất cả món đồ đều nhìn chung vào tổng số dư ví, cho phép bạn **khóa/phân bổ tiền** riêng cho món đồ ưu tiên nhất.
- Ví dụ: Ví có 5 triệu ➔ Bạn khóa 3 triệu vào hũ "iPhone 16", số tiền này được giữ riêng và không bị tính trùng lặp vào các món khác.

---

## ⏱️ Nhóm 2: Chấm Công Thông Minh Hóa (Smart Shift & Calendar)

### 2.1. Ca Mẫu 1 Chạm (Quick Shifts)
- Thực tế đi làm thường có các ca cố định (VD: *Ca Sáng: 08:00 - 16:00*, *Ca Gãy: 11:00 - 15:00*, *Ca Đêm: 22:00 - 06:00*).
- Trong Preset, cho phép lưu sẵn 2-3 **Ca Mẫu**.
- Khi vào tab Chấm Công: Chỉ cần ấn 1 nút (VD: `[🌙 Ca Đêm]`), giờ vào/ra tự động điền ngay lập tức, không cần cuộn thủ công nếu đi làm đúng ca!

### 2.2. Lịch Ca Làm Trực Quan (Monthly Heatmap / Calendar View)
- Trong tab Lịch Sử, thêm chế độ xem **Dạng Lịch Tháng (Calendar)**:
  - Mỗi ngày hiển thị chấm màu thương hiệu (McDonald, TikTok Shop...) và icon 🌙 ca đêm.
  - Bấm vào ngày bất kỳ để xem ngay số giờ và số tiền kiếm được.
  - Biểu đồ nhiệt (Heatmap) độ chăm chỉ theo tuần.

### 2.3. Cảnh Báo Sức Khỏe Ca Đêm (Night Shift Health Guard)
- Vì bạn làm việc đêm (22:00 - 06:00):
  - Hệ thống thống kê: *"Tháng này bạn đã làm X giờ đêm (chiếm Y% tổng thời gian)"*.
  - Nếu làm liên tục nhiều ca đêm trong tuần, hiển thị thẻ nhắc nhở tinh tế:
    - *"Tuần này bạn đã cày 4 ca đêm rồi. Nhớ bổ sung nước và ngủ bù đủ giấc nhé! 💤"*

---

## 🏢 Nhóm 3: Thương Hiệu & Đối Soát Lương (Audit & Reminders)

### 3.1. Đếm Ngược Ngày Nhận Lương (Payday Countdown)
- Cài đặt ngày nhận lương của từng thương hiệu (VD: McDonald ngày 10 hàng tháng, nhãn khác ngày 15).
- Trên Dashboard có widget đếm ngược:
  - *"⏳ Còn 3 ngày nữa đến ngày nhận lương McDonald (Dự kiến: 2.850.000 ₫)"*.

### 3.2. Xuất Bảng Kê Đối Soát Lương (Export CSV / PDF)
- Khi công ty chuyển khoản bị lệch hoặc kế toán tính thiếu giờ làm:
  - Ấn nút **"Xuất bảng chấm công"** ➔ Tải về file bảng kê chi tiết từng ngày, từng giờ vào/ra, số giờ đêm và số tiền tương ứng để bạn gửi trực tiếp cho quản lý/kế toán đối soát.
