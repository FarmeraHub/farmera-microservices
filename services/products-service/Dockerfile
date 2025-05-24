# ---- Stage 1: Build ----
# Sử dụng Node.js LTS phiên bản Alpine làm base image cho giai đoạn build
# Alpine nhỏ gọn, giúp giảm kích thước image cuối cùng
FROM node:20-alpine AS builder
# Đặt tên cho stage này là 'builder'

# Tạo thư mục ứng dụng
WORKDIR /usr/src/app

# Sao chép package.json và yarn.lock (hoặc package-lock.json)
# Sao chép riêng lẻ để tận dụng caching của Docker
COPY package.json yarn.lock* ./
# Trường hợp dùng npm: COPY package*.json ./

# Cài đặt tất cả dependencies (bao gồm cả devDependencies cần thiết cho build)
# Sử dụng 'yarn install --frozen-lockfile' để cài đặt chính xác từ lock file
RUN yarn install --frozen-lockfile
# Trường hợp dùng npm: RUN npm ci

# Sao chép toàn bộ mã nguồn còn lại vào thư mục làm việc trong container
COPY . .

# Chạy lệnh build để biên dịch TypeScript sang JavaScript (thường tạo ra thư mục 'dist')
RUN yarn build

# ---- Stage 2: Production ----
# Sử dụng cùng một base image Node.js Alpine cho môi trường production
FROM node:20-alpine

# Đặt tên cho stage này là 'production' (không bắt buộc, nhưng rõ ràng)
WORKDIR /usr/src/app

# Sao chép package.json và yarn.lock từ thư mục gốc
COPY package.json yarn.lock* ./
# Trường hợp dùng npm: COPY package*.json ./

# Chỉ cài đặt production dependencies
RUN yarn install --production --frozen-lockfile
# Trường hợp dùng npm: RUN npm ci --only=production

# Sao chép thư mục 'dist' (kết quả build) từ builder stage vào thư mục làm việc hiện tại
COPY --from=builder /usr/src/app/dist ./dist

# --- Dòng này đã được XÓA vì không cần thiết và sai ---
# COPY --from=builder /usr/src/app/node_modules ./node_modules

# Expose cổng mà ứng dụng NestJS đang lắng nghe (từ biến môi trường PORT, mặc định 3000 nếu không có)
# Đặt giá trị mặc định nếu PORT không được cung cấp khi chạy container
ARG PORT=3333
EXPOSE ${PORT}

# Lệnh để chạy ứng dụng khi container khởi động
# Sử dụng node để chạy file main.js đã được biên dịch
CMD ["node", "dist/main.js"]