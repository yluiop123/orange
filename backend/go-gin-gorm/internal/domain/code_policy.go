package domain

import "strings"

const (
	StatusAll      = "all"
	StatusEnabled  = "1"
	StatusDisabled = "0"
)

// CodePolicy is the single backend rule for tree business codes. Root codes
// have RootLength digits; children are parent + SegmentLength digits and must
// start with the parent code. Codes are immutable once created.
type CodePolicy struct {
	RootLength    int
	SegmentLength int
	Label         string
}

var (
	GroupCodePolicy      = CodePolicy{RootLength: 2, SegmentLength: 2, Label: "组织"}
	PermissionCodePolicy = CodePolicy{RootLength: 4, SegmentLength: 2, Label: "权限"}
)

func (p CodePolicy) Validate(id, parentID string) error {
	if strings.TrimSpace(id) == "" {
		return Validation(p.Label + "编码不能为空")
	}
	if !digitsOnly(id) {
		return Validation(p.Label + "编码只能包含数字")
	}
	parent := strings.TrimSpace(parentID)
	if parent == "" {
		if len(id) != p.RootLength {
			return Validation("根" + p.Label + "编码长度必须为" + itoa(p.RootLength))
		}
		return nil
	}
	expected := len(parent) + p.SegmentLength
	if len(id) != expected {
		return Validation(p.Label + "编码长度必须为" + itoa(expected))
	}
	if !strings.HasPrefix(id, parent) {
		return Validation(p.Label + "编码必须以" + parent + "开头")
	}
	return nil
}

func digitsOnly(value string) bool {
	if value == "" {
		return false
	}
	for _, r := range value {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func itoa(value int) string {
	if value == 0 {
		return "0"
	}
	var buf [20]byte
	pos := len(buf)
	for value > 0 {
		pos--
		buf[pos] = byte('0' + value%10)
		value /= 10
	}
	return string(buf[pos:])
}
