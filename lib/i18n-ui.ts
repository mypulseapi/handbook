import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from './i18n';

/**
 * UI chrome strings, which are separate from page content.
 *
 * Fumadocs keys these by the English string plus a context suffix, so the key is also the
 * fallback: a key left out renders English rather than a blank.
 *
 * **The Vietnamese here is a first pass written by an engineer, not a translator.** It is
 * accurate and idiomatic enough to ship, and it has not been reviewed by a native speaker. The
 * marketing site carries the same caveat in `content/locale.ts`; anything customer-facing should
 * be reviewed before launch.
 */
export const { provider } = defineI18nUI(i18n, {
  en: { displayName: 'English' },
  vi: {
    displayName: 'Tiếng Việt',

    // Search
    'Search(search trigger)': 'Tìm kiếm',
    'Search(search dialog)': 'Tìm kiếm tài liệu',
    'No results found(search dialog)': 'Không tìm thấy kết quả',
    'Search failed(search dialog)': 'Tìm kiếm thất bại',
    'Open Search(search trigger)(aria-label)': 'Mở tìm kiếm',
    'Close Search(search dialog)(aria-label)': 'Đóng tìm kiếm',

    // Table of contents
    'On this page(table of contents)': 'Trong trang này',
    'No Headings(table of contents)': 'Không có mục nào',
    'Table of Contents(inline table of contents)': 'Mục lục',

    // Page actions
    'Copy Markdown(page actions)': 'Sao chép Markdown',
    'Copied Markdown(page actions)': 'Đã sao chép',
    'View as Markdown(page actions)': 'Xem dạng Markdown',
    'Open(page actions)': 'Mở',
    'Edit on GitHub(edit page)': 'Sửa trên GitHub',
    'Last updated on(page footer)': 'Cập nhật lần cuối',

    // Navigation
    'Next Page(pagination)': 'Trang sau',
    'Previous Page(pagination)': 'Trang trước',
    'Hide Sidebar(sidebar)': 'Ẩn thanh bên',
    'Show Sidebar(sidebar)': 'Hiện thanh bên',
    'Open Sidebar(aria-label)': 'Mở thanh bên',
    'Close Sidebar(aria-label)': 'Đóng thanh bên',
    'Collapse Sidebar(sidebar)(aria-label)': 'Thu gọn thanh bên',
    'Toggle Menu(home layout header)(aria-label)': 'Mở menu',

    // Language and theme
    'Language(language switcher)': 'Ngôn ngữ',
    'Choose a language(language switcher)': 'Chọn ngôn ngữ',
    'Choose a language(language switcher)(aria-label)': 'Chọn ngôn ngữ',
    'Theme(site menu)': 'Giao diện',
    'Toggle Theme(theme switcher)(aria-label)': 'Đổi giao diện',
    'Light(theme switcher)(aria-label)': 'Sáng',
    'Dark(theme switcher)(aria-label)': 'Tối',
    'System(theme switcher)(aria-label)': 'Theo hệ thống',

    // Code blocks
    'Copy Text(code block)(aria-label)': 'Sao chép',
    'Copied Text(code block)(aria-label)': 'Đã sao chép',
    'Copy Anchor Link(heading anchor)(aria-label)': 'Sao chép liên kết mục',
    'Copied Anchor Link(heading anchor)(aria-label)': 'Đã sao chép liên kết',

    // Type tables, used by the SDK and API reference
    'Prop(type table)': 'Thuộc tính',
    'Type(type table)': 'Kiểu',
    'Default(type table)': 'Mặc định',
    'Parameters(type table)': 'Tham số',
    'Returns(type table)': 'Trả về',

    // 404
    'Page Not Found(404 not found page)': 'Không tìm thấy trang',
    'Back to Home(404 not found page)': 'Về trang chủ',
    'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 not found page)':
      'Trang bạn tìm có thể đã bị xoá, đã đổi tên, hoặc tạm thời không truy cập được.',
  },
});
