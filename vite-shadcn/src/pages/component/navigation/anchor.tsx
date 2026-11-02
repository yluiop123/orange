import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const SECTIONS = ['section1', 'section2', 'section3'];

export default function AnchorPage() {
    const [active, setActive] = useState<string>(window.location.hash || "#section1");
    
    // 监听滚动事件以更新活动状态
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100; // 添加偏移量以提前激活锚点
            
            for (const section of SECTIONS) {
                const element = document.getElementById(section);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const height = element.offsetHeight;
                    
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
                        setActive(`#${section}`);
                        break;
                    }
                }
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        
        // 初始化时也检查一次
        handleScroll();
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleClick = (sectionId: string) => {
        setActive(`#${sectionId}`);
        // 确保页面滚动到目标位置
        setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 10);
    };
    
    return (
        <div className="flex gap-10 h-full">
            {/* 左侧导航栏 - 固定位置 */}
            <nav className="w-48 space-y-2 sticky top-0 self-start p-4 dark:bg-black shadow-sm rounded-lg border  dark:border-border mt-5 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {SECTIONS.map((section) => (
                    <a
                        key={section}
                        href={`#${section}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleClick(section);
                        }}
                        className={cn(
                            "block px-3 py-2 rounded-md transition-all duration-200 ease-in-out cursor-pointer text-sm",
                            active === `#${section}` 
                                ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground font-medium border-l-2 border-primary dark:border-primary-400 pl-2" 
                                : "text-gray-600 dark:text-gray-300 hover:bg-accent dark:hover:bg-accent hover:text-gray-900 dark:hover:text-primary-foreground"
                        )}
                    >
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                    </a>
                ))}
            </nav>

            {/* 内容部分 - 允许滚动 */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <section id="section1" className="pt-20 pb-10 bg-gradient-to-b from-red-50 to-white dark:from-secondary/30 dark:to-secondary min-h-[calc(100vh-10rem)]">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-secondary-foreground">Section 1</h2>
                    <p className="text-gray-600 dark:text-secondary-foreground/80 mb-4">这里是 Section 1 的内容，随便加点文字撑开空间。</p>
                    <div className="space-y-4">
                        {[...Array(20)].map((_, i) => (
                            <p key={i} className="text-gray-600 dark:text-secondary-foreground/80 leading-relaxed">
                                这是 Section 1 的第 {i+1} 段内容，用于演示滚动效果和锚点导航功能。
                                当您滚动页面时，左侧导航会自动高亮显示当前可见区域对应的章节。
                            </p>
                        ))}
                    </div>
                </section>

                <section id="section2" className="pt-20 pb-10 bg-gradient-to-b from-green-50 to-white dark:from-secondary/30 dark:to-secondary min-h-[calc(100vh-10rem)]">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-secondary-foreground">Section 2</h2>
                    <p className="text-gray-600 dark:text-secondary-foreground/80 mb-4">这里是 Section 2 的内容。</p>
                    <div className="space-y-4">
                        {[...Array(20)].map((_, i) => (
                            <p key={i} className="text-gray-600 dark:text-secondary-foreground/80 leading-relaxed">
                                这是 Section 2 的第 {i+1} 段内容，用于演示滚动效果和锚点导航功能。
                                当您滚动页面时，左侧导航会自动高亮显示当前可见区域对应的章节。
                            </p>
                        ))}
                    </div>
                </section>

                <section id="section3" className="pt-20 pb-10 bg-gradient-to-b from-blue-50 to-white dark:from-secondary/30 dark:to-secondary min-h-[calc(100vh-10rem)]">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-secondary-foreground">Section 3</h2>
                    <p className="text-gray-600 dark:text-secondary-foreground/80 mb-4">这里是 Section 3 的内容。</p>
                    <div className="space-y-4">
                        {[...Array(20)].map((_, i) => (
                            <p key={i} className="text-gray-600 dark:text-secondary-foreground/80 leading-relaxed">
                                这是 Section 3 的第 {i+1} 段内容，用于演示滚动效果和锚点导航功能。
                                当您滚动页面时，左侧导航会自动高亮显示当前可见区域对应的章节。
                            </p>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}