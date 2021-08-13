using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Media.Imaging;
using Size = System.Drawing.Size;

namespace SkillClipper
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private Rectangle clipRect = new Rectangle(-40, 12, 32, 32);    // x は実行時に代入(右寄りのため)
        private Bitmap _bitmap = null;

        private enum Mode
        {
            NotCapture,
            Captured,
        }

        public MainWindow()
        {
            InitializeComponent();
        }

        private void CaptureButton_Click(object sender, RoutedEventArgs e)
        {
            if (_bitmap != null)
                _bitmap.Dispose();

            using var bitmap = FEZScreenShooter.Shoot();
            clipRect.X = bitmap.Width - 40;
            _bitmap = bitmap.Clone(clipRect, PixelFormat.Format32bppArgb);

            var hbitmap = _bitmap.GetHbitmap();
            Image1.Source = Imaging.CreateBitmapSourceFromHBitmap(hbitmap, IntPtr.Zero, Int32Rect.Empty, BitmapSizeOptions.FromEmptyOptions());

            NativeMethods.DeleteObject(hbitmap);
        }

        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            if (_bitmap == null)
                return;

            var selectedSkill = ComboBox1.SelectedItem as Skill;
            if (selectedSkill == null || JobComboBox.SelectedItem == null)
                return;

            var rootDir = new DirectoryInfo("skillicon");
            rootDir.Create();
            var subDir = rootDir.CreateSubdirectory(((ComboBoxItem)JobComboBox.SelectedItem).Content.ToString());
            subDir.Create();

            _bitmap.Save($"{subDir.FullName}\\{selectedSkill.Id}.png");

            Image1.Source = null;
            ComboBox1.SelectedIndex = -1;
        }

        private void JobComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var job = ((ComboBoxItem)JobComboBox.SelectedItem).Content.ToString();
            using var sr = new StreamReader($"tsv/{job}.tsv");
            var skills = sr.ReadToEnd()
                    .Replace("\r\n", "\r")
                    .Split("\r")
                    .Skip(1)    // 先頭行skip
                    .Select(line => line.Split("\t"))
                    .Select(x => new Skill(x[1], x[2]))
                    .ToList();
            ComboBox1.ItemsSource = skills;
        }

        private record Skill(string Id, string Name);
    }

    public static class FEZScreenShooter
    {
        public static Bitmap Shoot()
        {
            using (var p = System.Diagnostics.Process.GetProcessesByName("FEzero_Client").FirstOrDefault())
            {
                if (p == null)
                {
                    return null;
                }

                RECT rect;
                if (!NativeMethods.GetWindowRect(p.MainWindowHandle, out rect))
                {
                    return null;
                }

                Size size = new Size(rect.Right - rect.Left, rect.Bottom - rect.Top);
                Bitmap bmp = new Bitmap(size.Width, size.Height, PixelFormat.Format32bppArgb);
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.CopyFromScreen(rect.Left, rect.Top, 0, 0, size, CopyPixelOperation.SourceCopy);
                }

                return bmp;
            }
        }
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public static class NativeMethods
    {
        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool GetWindowRect(IntPtr hwnd, out RECT lpRect);
        
        [DllImport("gdi32.dll")]
        public static extern bool DeleteObject(IntPtr hObject);
    }
}
