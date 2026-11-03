import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useState } from "react"

export default function PaginationPage() {
  const totalPages = 5
  const [page, setPage] = useState(1)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h2 className="text-2xl font-semibold">分页示例 / Pagination Example</h2>
      <p className="text-muted-foreground text-sm">
        当前页：{page} / Current Page: {page}
      </p>

      {/* ===== 分页组件 / Pagination Component ===== */}
      <Pagination>
        <PaginationContent>
          {/* 上一页 / Previous */}
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(page - 1)
              }}
            >
              上一页 / Prev
            </PaginationPrevious>
          </PaginationItem>

          {/* 页码 / Page Numbers */}
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(pageNum)
                  }}
                  isActive={page === pageNum}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          {/* 省略号 / Ellipsis */}
          <PaginationItem>
            <PaginationEllipsis title="更多 / More" />
          </PaginationItem>

          {/* 下一页 / Next */}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(page + 1)
              }}
            >
              下一页 / Next
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* ===== 页面内容 / Page Content ===== */}
      <div className="border rounded-md p-4 w-[300px] text-center text-sm bg-card">
        <p>当前显示第 {page} 页内容</p>
        <p className="text-muted-foreground">
          Showing content for page {page}.
        </p>
      </div>
    </div>
  )
}
