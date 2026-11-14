# 💰 MyFinance - Quản Lý Lương & Mục Tiêu Ước Mơ

Hệ thống web app cá nhân hóa cao cấp giúp quản lý thu nhập từ các thương hiệu/công việc, chấm công thông minh tự tính ca đêm, tích lũy tiền lương và theo dõi tiến độ hoàn thành các món đồ mơ ước.

---

## ✨ Tính Năng Nổi Bật

### 1. 📊 Tổng Quan Tài Chính (Dashboard)
- **Hiển thị 2 loại số dư to nhất**:
  - 💵 **Tiền mặt thực tế**: Tiền đang có sẵn trong túi.
  - ⏳ **Lương chờ nhận**: Tổng tiền các ca làm việc chưa duyệt từ các thương hiệu.
- Đồng hồ thời gian thực + thống kê hoạt động gần nhất.
- Bảng danh sách các thương hiệu đang giữ lương.

### 2. ⏱️ Chấm Công & Preset Công Việc (Check-in / Check-out)
- **Presets công việc**: Cấu hình lương theo giờ, màu sắc nhận diện, và **% phụ cấp ca đêm**.
- **Tự động nhận diện ca đêm**: Khung giờ **22:00 đêm đến 06:00 sáng hôm sau** được tự động tách riêng và cộng đúng % phụ cấp.
- **Bộ chọn Ngày & Giờ dạng cuộn (Scroll Picker)**: Giao diện mượt mà, hỗ trợ tối ưu trên điện thoại.
- **Màn hình chúc mừng (Celebration Modal)**: Tự động tổng kết số giờ, tiền kiếm được hôm nay kèm pháo hoa và tự đóng sau 4 giây.
- **Lịch sử chấm công chi tiết**: Bộ lọc theo thương hiệu, tháng và trạng thái; phân tích số giờ ngày/đêm.

### 3. 🏢 Thương Hiệu & Quy Trình Duyệt Lương
- Quản lý theo chu kỳ nhận lương của từng công ty/thương hiệu.
- **Duyệt lương thực nhận**: Nhập số tiền công ty chuyển khoản thực tế, hệ thống tự tính độ chênh lệch (thưởng/phạt) và lưu lại lịch sử.
- Sau khi duyệt, tiền tự động chuyển vào quỹ tiền mặt và mở chu kỳ làm việc mới.

### 4. 🎯 Mục Tiêu Ước Mơ (Wishlist)
- Thêm món đồ mong muốn với tên, giá tiền VND, ghi chú và độ ưu tiên.
- **Link ảnh & TikTok**: Hỗ trợ dán trực tiếp nhiều link video TikTok và link ảnh với trình xác thực trực tiếp.
- **Thanh tiến trình thông minh**:
  - Tính % dựa trên tiền mặt sẵn có.
  - Dự báo % khi kết hợp cả tiền lương đang chờ nhận.
  - Dự đoán số ngày còn lại để mua được món đồ dựa trên tốc độ kiếm tiền.
- **Công cụ tính ca làm**: Bấm vào món đồ để xem ca làm hôm nay đã đóng góp thêm bao nhiêu % tiến độ cho mục tiêu.
- Hiệu ứng chúc mừng rực rỡ khi món đồ đạt 100% tiến độ.

---

## 🛠️ Cài Đặt & Kết Nối Cơ Sở Dữ Liệu (Supabase - Hoàn Toàn Miễn Phí)

Dự án sử dụng **Supabase** (PostgreSQL Cloud miễn phí) để mọi thiết bị (máy tính, điện thoại) đều đồng bộ chung một dữ liệu.

### Bước 1: Tạo tài khoản & Project trên Supabase
1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập/đăng ký miễn phí.
2. Bấm **"New Project"**, đặt tên (ví dụ: `myfinance`), chọn mật khẩu database và Region (khuyên chọn `Singapore` để truy cập nhanh nhất).

### Bước 2: Chạy Script tạo bảng dữ liệu
1. Trong giao diện Supabase, vào mục **SQL Editor** (biểu tượng `>_` ở thanh menu bên trái).
2. Mở file [supabase-schema.sql](./supabase-schema.sql) trong thư mục dự án này, copy toàn bộ nội dung và dán vào SQL Editor.
3. Bấm nút **Run** (màu xanh lá) để khởi tạo các bảng: `wallet`, `job_presets`, `work_sessions`, `salary_cycles`, `wish_items`, `transactions`.

### Bước 3: Lấy API Keys
1. Vào mục **Project Settings** (biểu tượng bánh răng) -> **API**.
2. Copy 2 thông số:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Tạo file `.env.local` ở thư mục gốc dự án và dán vào:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Triển Khai Lên Vercel (Miễn Phí)

1. Đẩy code lên GitHub repository của bạn.
2. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
3. Bấm **"Add New..."** -> **"Project"**, chọn repo `myfinance`.
4. Trong phần **Environment Variables**, thêm 2 biến môi trường lấy từ Supabase ở trên:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Bấm **Deploy**. Sau khoảng 1 phút, bạn sẽ có một đường link web dạng `https://myfinance-xxx.vercel.app` để truy cập trên mọi thiết bị!

---

## 📱 Cài Đặt Vào Màn Hình Chính Điện Thoại (PWA)

Web app đã được tối ưu PWA:
- **Trên iPhone (Safari)**: Bấm nút Chia sẻ (biểu tượng mũi tên hướng lên) -> Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
- **Trên Android (Chrome)**: Bấm biểu tượng 3 chấm ở góc trên -> Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.
