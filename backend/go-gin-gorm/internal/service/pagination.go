package service

// PageData is the shared paginated list envelope used by roles, users and
// operation logs.
type PageData[T any] struct {
	Total      int64 `json:"total"`
	List       []T   `json:"list"`
	Page       int   `json:"page"`
	Size       int   `json:"size"`
	TotalPages int   `json:"totalPages"`
}

func newPageData[T any](total int64, list []T, page, size int) PageData[T] {
	if list == nil {
		list = make([]T, 0)
	}
	return PageData[T]{
		Total:      total,
		List:       list,
		Page:       page,
		Size:       size,
		TotalPages: totalPages(total, size),
	}
}
