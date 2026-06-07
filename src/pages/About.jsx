import './About.css';

function About() {
  return (
    <div className="about-container">
      <h1>About NLP Analyzer</h1>

      <section className="about-section">
        <h2>Mục đích & Đối tượng sử dụng</h2>
        <p>Ứng dụng được thiết kế nhằm mục đích hỗ trợ học sinh, sinh viên, nhà nghiên cứu ngôn ngữ học, và lập trình viên trong việc phân tích cấu trúc ngữ pháp tiếng Anh. Công cụ giúp trực quan hóa mối quan hệ phụ thuộc giữa các từ trong câu (Dependency Parsing) một cách dễ hiểu thông qua cấu trúc cây.</p>
      </section>

      <section className="about-section">
        <h2>Công nghệ cốt lõi</h2>
        <ul>
          <li><strong>Frontend:</strong> React.js, Vite, React Router DOM. Kiến trúc component giúp tái sử dụng và quản lý state hiệu quả.</li>
          <li><strong>Backend:</strong> Node.js (API Gateway) và FastAPI (Python Microservice). Phân tách logic xử lý ngôn ngữ nặng ra khỏi server giao tiếp chính.</li>
          <li><strong>NLP Engine:</strong> <a href="https://spacy.io/" target="_blank" rel="noreferrer">spaCy</a> - thư viện Xử lý Ngôn ngữ Tự nhiên mạnh mẽ của Python, sử dụng mô hình <code>en_core_web_sm</code> (hoặc transformer) để gắn thẻ từ loại (POS tagging) và phân tích cú pháp phụ thuộc.</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Chức năng đang phát triển</h2>
        <ul>
          <li>Hỗ trợ phân tích đa ngôn ngữ (Multilingual support).</li>
          <li>Tính năng dịch thuật (Translation) trước khi phân tích.</li>
          <li>Giao diện đồ họa nâng cao cho cấu trúc cây ngữ pháp.</li>
        </ul>
      </section>

      <section className="about-section warning">
        <h2>Giới hạn & Lưu ý (Disclaimers)</h2>
        <p>Do bản chất của Trí tuệ Nhân tạo (AI) và các mô hình học máy:</p>
        <ul>
          <li>Hệ thống <strong>không đảm bảo độ chính xác 100%</strong>.</li>
          <li>Kết quả phân tích có thể bị sai lệch đối với các câu chứa lỗi chính tả, sai ngữ pháp nặng, câu tối nghĩa (gibberish), hoặc câu có cấu trúc quá phức tạp.</li>
          <li>Hiện tại hệ thống chỉ hoạt động tốt nhất với câu chuẩn tiếng Anh.</li>
        </ul>
      </section>

      <section className="about-section contact">
        <h2>Phản hồi & Liên hệ</h2>
        <p>Sự đóng góp của bạn giúp chúng tôi cải thiện hệ thống tốt hơn. Vui lòng sử dụng <strong>nút Feedback</strong> (biểu tượng 💬) ở góc dưới cùng bên phải màn hình để gửi ý kiến, báo lỗi, hoặc góp ý tính năng.</p>
      </section>
    </div>
  );
}

export default About;
