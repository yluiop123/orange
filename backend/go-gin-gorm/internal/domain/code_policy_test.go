package domain

import "testing"

func TestGroupCodePolicy(t *testing.T) {
	tests := []struct {
		name     string
		id       string
		parentID string
		wantErr  bool
	}{
		{name: "root two digits", id: "00"},
		{name: "child of root", id: "0001", parentID: "00"},
		{name: "grandchild", id: "000301", parentID: "0003"},
		{name: "root wrong length", id: "000", wantErr: true},
		{name: "root three digits", id: "001", wantErr: true},
		{name: "child wrong length", id: "00001", parentID: "00", wantErr: true},
		{name: "child wrong prefix", id: "0101", parentID: "00", wantErr: true},
		{name: "non digits", id: "00a1", parentID: "00", wantErr: true},
		{name: "blank", id: "", wantErr: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := GroupCodePolicy.Validate(test.id, test.parentID)
			if (err != nil) != test.wantErr {
				t.Fatalf("Validate(%q, %q) error = %v, wantErr %v", test.id, test.parentID, err, test.wantErr)
			}
		})
	}
}

func TestPermissionCodePolicy(t *testing.T) {
	tests := []struct {
		name     string
		id       string
		parentID string
		wantErr  bool
	}{
		{name: "root four digits", id: "0000"},
		{name: "menu child", id: "000500", parentID: "0005"},
		{name: "action child", id: "00050000", parentID: "000500"},
		{name: "root two digits", id: "00", wantErr: true},
		{name: "child not parent plus two", id: "0005010", parentID: "0005", wantErr: true},
		{name: "child wrong prefix", id: "000600", parentID: "0005", wantErr: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := PermissionCodePolicy.Validate(test.id, test.parentID)
			if (err != nil) != test.wantErr {
				t.Fatalf("Validate(%q, %q) error = %v, wantErr %v", test.id, test.parentID, err, test.wantErr)
			}
		})
	}
}
