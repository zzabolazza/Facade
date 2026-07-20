package backup

import "errors"

var (
	// ErrInvalidPassword 表示 ZIP 密码错误或加密校验失败。
	ErrInvalidPassword = errors.New("密码错误或备份文件已损坏")
)
