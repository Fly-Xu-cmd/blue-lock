from PIL import Image, ImageFont, ImageDraw

FONT = "simhei.ttf"   # 字体文件名
SIZE = 16             # 点阵大小

texts = """
系统启动成功
蓝牙已连接
请输入密码
设备已解锁
错误
"""

chars = set("".join(texts.strip()))
print("需要生成的汉字数：", len(chars))

font = ImageFont.truetype(FONT, SIZE)

for ch in chars:
    img = Image.new("1", (16, 16), 0)
    draw = ImageDraw.Draw(img)
    draw.text((0, 0), ch, 1, font)

    data = []
    for y in range(16):
        left = right = 0
        for x in range(8):
            if img.getpixel((x, y)):
                left |= (0x80 >> x)
            if img.getpixel((x + 8, y)):
                right |= (0x80 >> x)
        data.append(left)
        data.append(right)

    print(f"{{0x{ord(ch):04X}, {{", end="")
    print(",".join(f"0x{b:02X}" for b in data), end="")
    print("}},")
