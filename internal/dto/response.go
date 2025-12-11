package dto

// Response 通用响应结构体
type Response struct {
	Error   bool        `json:"error"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// NewResponse 创建新的响应实例
func NewResponse() *Response {
	return &Response{}
}

// Ok 设置成功响应
func (r *Response) Ok(message string) *Response {
	r.Error = false
	r.Message = message
	return r
}

// WithData 添加数据到响应中
func (r *Response) WithData(data interface{}) *Response {
	r.Data = data
	return r
}

// Fail 设置失败响应
func (r *Response) Fail(message string) *Response {
	r.Error = true
	r.Message = message
	r.Data = nil
	return r
}

// 静态方法 - 直接创建成功响应
func Success(message string) *Response {
	return &Response{
		Error:   false,
		Message: message,
	}
}

// 静态方法 - 直接创建成功响应并带数据
func SuccessWithData(message string, data interface{}) *Response {
	return &Response{
		Error:   false,
		Message: message,
		Data:    data,
	}
}

// 静态方法 - 直接创建错误响应
func Error(message string) *Response {
	return &Response{
		Error:   true,
		Message: message,
	}
}
