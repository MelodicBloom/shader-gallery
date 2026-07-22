#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <math.h>

typedef void *EGLDisplay; typedef void *EGLConfig; typedef void *EGLSurface; typedef void *EGLContext;
typedef int32_t EGLint; typedef uint32_t EGLBoolean; typedef uint32_t EGLenum;
typedef unsigned int GLenum; typedef unsigned int GLuint; typedef int GLint; typedef int GLsizei; typedef char GLchar; typedef float GLfloat; typedef unsigned char GLboolean; typedef intptr_t GLsizeiptr; typedef unsigned char GLubyte;

#define EGL_DEFAULT_DISPLAY ((void*)0)
#define EGL_NO_DISPLAY ((void*)0)
#define EGL_NO_SURFACE ((void*)0)
#define EGL_NO_CONTEXT ((void*)0)
#define EGL_NONE 0x3038
#define EGL_RED_SIZE 0x3024
#define EGL_GREEN_SIZE 0x3023
#define EGL_BLUE_SIZE 0x3022
#define EGL_ALPHA_SIZE 0x3021
#define EGL_SURFACE_TYPE 0x3033
#define EGL_PBUFFER_BIT 0x0001
#define EGL_RENDERABLE_TYPE 0x3040
#define EGL_OPENGL_ES3_BIT_KHR 0x0040
#define EGL_WIDTH 0x3057
#define EGL_HEIGHT 0x3056
#define EGL_CONTEXT_CLIENT_VERSION 0x3098
#define EGL_OPENGL_ES_API 0x30A0
#define EGL_PLATFORM_SURFACELESS_MESA 0x31DD

#define GL_VERTEX_SHADER 0x8B31
#define GL_FRAGMENT_SHADER 0x8B30
#define GL_COMPILE_STATUS 0x8B81
#define GL_LINK_STATUS 0x8B82
#define GL_INFO_LOG_LENGTH 0x8B84
#define GL_ARRAY_BUFFER 0x8892
#define GL_STATIC_DRAW 0x88E4
#define GL_FLOAT 0x1406
#define GL_FALSE 0
#define GL_TRIANGLES 0x0004
#define GL_COLOR_BUFFER_BIT 0x00004000
#define GL_RGBA 0x1908
#define GL_UNSIGNED_BYTE 0x1401
#define GL_NO_ERROR 0

extern EGLDisplay eglGetDisplay(void *display_id);
extern EGLBoolean eglInitialize(EGLDisplay dpy, EGLint *major, EGLint *minor);
extern EGLBoolean eglTerminate(EGLDisplay dpy);
extern EGLBoolean eglBindAPI(EGLenum api);
extern EGLBoolean eglChooseConfig(EGLDisplay dpy, const EGLint *attrib_list, EGLConfig *configs, EGLint config_size, EGLint *num_config);
extern EGLSurface eglCreatePbufferSurface(EGLDisplay dpy, EGLConfig config, const EGLint *attrib_list);
extern EGLContext eglCreateContext(EGLDisplay dpy, EGLConfig config, EGLContext share_context, const EGLint *attrib_list);
extern EGLBoolean eglMakeCurrent(EGLDisplay dpy, EGLSurface draw, EGLSurface read, EGLContext ctx);
extern EGLBoolean eglDestroySurface(EGLDisplay dpy, EGLSurface surface);
extern EGLBoolean eglDestroyContext(EGLDisplay dpy, EGLContext ctx);
extern void *eglGetProcAddress(const char *procname);
extern EGLint eglGetError(void);
typedef EGLDisplay (*PFNEGLGETPLATFORMDISPLAYEXTPROC)(EGLenum platform, void *native_display, const EGLint *attrib_list);

extern GLuint glCreateShader(GLenum type);
extern void glShaderSource(GLuint shader, GLsizei count, const GLchar *const*string, const GLint *length);
extern void glCompileShader(GLuint shader);
extern void glGetShaderiv(GLuint shader, GLenum pname, GLint *params);
extern void glGetShaderInfoLog(GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *infoLog);
extern void glDeleteShader(GLuint shader);
extern GLuint glCreateProgram(void);
extern void glAttachShader(GLuint program, GLuint shader);
extern void glBindAttribLocation(GLuint program, GLuint index, const GLchar *name);
extern void glLinkProgram(GLuint program);
extern void glGetProgramiv(GLuint program, GLenum pname, GLint *params);
extern void glGetProgramInfoLog(GLuint program, GLsizei bufSize, GLsizei *length, GLchar *infoLog);
extern void glDeleteProgram(GLuint program);
extern void glUseProgram(GLuint program);
extern void glViewport(GLint x, GLint y, GLsizei width, GLsizei height);
extern void glClearColor(GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha);
extern void glClear(GLenum mask);
extern void glGenVertexArrays(GLsizei n, GLuint *arrays);
extern void glBindVertexArray(GLuint array);
extern void glDeleteVertexArrays(GLsizei n, const GLuint *arrays);
extern void glGenBuffers(GLsizei n, GLuint *buffers);
extern void glBindBuffer(GLenum target, GLuint buffer);
extern void glBufferData(GLenum target, GLsizeiptr size, const void *data, GLenum usage);
extern void glDeleteBuffers(GLsizei n, const GLuint *buffers);
extern void glEnableVertexAttribArray(GLuint index);
extern void glVertexAttribPointer(GLuint index, GLint size, GLenum type, GLboolean normalized, GLsizei stride, const void *pointer);
extern GLint glGetUniformLocation(GLuint program, const GLchar *name);
extern void glUniform1f(GLint location, GLfloat v0);
extern void glUniform1i(GLint location, GLint v0);
extern void glUniform2f(GLint location, GLfloat v0, GLfloat v1);
extern void glUniform3f(GLint location, GLfloat v0, GLfloat v1, GLfloat v2);
extern void glUniform4f(GLint location, GLfloat v0, GLfloat v1, GLfloat v2, GLfloat v3);
extern void glDrawArrays(GLenum mode, GLint first, GLsizei count);
extern void glFinish(void);
extern void glReadPixels(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type, void *data);
extern GLenum glGetError(void);

static char *read_file(const char *path) {
  FILE *file = fopen(path, "rb");
  if (!file) { perror(path); return NULL; }
  fseek(file, 0, SEEK_END); long size = ftell(file); rewind(file);
  char *buffer = (char*)malloc((size_t)size + 1);
  if (!buffer) { fclose(file); return NULL; }
  if (fread(buffer, 1, (size_t)size, file) != (size_t)size) { fclose(file); free(buffer); return NULL; }
  buffer[size] = '\0'; fclose(file); return buffer;
}

static GLuint compile_shader(GLenum type, const char *source, const char *label) {
  GLuint shader = glCreateShader(type);
  glShaderSource(shader, 1, &source, NULL);
  glCompileShader(shader);
  GLint ok = 0; glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
  if (!ok) {
    GLint length = 0; glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &length);
    int capacity = length > 1 ? length : 4096;
    char *log = (char*)calloc((size_t)capacity, 1);
    glGetShaderInfoLog(shader, capacity, NULL, log);
    fprintf(stderr, "%s compile failed:\n%s\n", label, log ? log : "unknown error");
    free(log); glDeleteShader(shader); return 0;
  }
  return shader;
}

static void set_uniform(GLuint program, const char *spec) {
  char *copy = strdup(spec);
  if (!copy) return;
  char *type = strtok(copy, ":");
  char *name = strtok(NULL, ":");
  char *values = strtok(NULL, "");
  if (!type || !name || !values) { free(copy); return; }
  GLint location = glGetUniformLocation(program, name);
  if (location < 0) { free(copy); return; }

  if (strcmp(type, "f") == 0) glUniform1f(location, (GLfloat)atof(values));
  else if (strcmp(type, "i") == 0 || strcmp(type, "b") == 0) glUniform1i(location, atoi(values));
  else {
    float parsed[4] = {0,0,0,0}; int count = 0;
    char *cursor = values;
    while (cursor && count < 4) {
      char *comma = strchr(cursor, ',');
      if (comma) *comma = '\0';
      parsed[count++] = (float)atof(cursor);
      cursor = comma ? comma + 1 : NULL;
    }
    if (strcmp(type, "v2") == 0 && count >= 2) glUniform2f(location, parsed[0], parsed[1]);
    else if (strcmp(type, "v3") == 0 && count >= 3) glUniform3f(location, parsed[0], parsed[1], parsed[2]);
    else if (strcmp(type, "v4") == 0 && count >= 4) glUniform4f(location, parsed[0], parsed[1], parsed[2], parsed[3]);
  }
  free(copy);
}

int main(int argc, char **argv) {
  if (argc < 6) {
    fprintf(stderr, "usage: %s vertex.glsl fragment.glsl width height output.rgba|- [uniform-spec ...]\n", argv[0]);
    return 2;
  }

  const char *vertex_path = argv[1];
  const char *fragment_path = argv[2];
  int width = atoi(argv[3]);
  int height = atoi(argv[4]);
  const char *output_path = argv[5];
  if (width < 1 || height < 1 || width > 4096 || height > 4096) { fprintf(stderr, "invalid dimensions\n"); return 2; }

  char *vertex_source = read_file(vertex_path);
  char *fragment_source = read_file(fragment_path);
  if (!vertex_source || !fragment_source) return 2;

  EGLDisplay display = EGL_NO_DISPLAY;
  PFNEGLGETPLATFORMDISPLAYEXTPROC get_platform = (PFNEGLGETPLATFORMDISPLAYEXTPROC)eglGetProcAddress("eglGetPlatformDisplayEXT");
  if (get_platform) display = get_platform(EGL_PLATFORM_SURFACELESS_MESA, EGL_DEFAULT_DISPLAY, NULL);
  EGLint major = 0, minor = 0;
  if (display == EGL_NO_DISPLAY || !eglInitialize(display, &major, &minor)) {
    display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if (display == EGL_NO_DISPLAY || !eglInitialize(display, &major, &minor)) {
      fprintf(stderr, "EGL initialize failed: 0x%x\n", eglGetError()); return 3;
    }
  }
  if (!eglBindAPI(EGL_OPENGL_ES_API)) { fprintf(stderr, "eglBindAPI failed: 0x%x\n", eglGetError()); return 3; }

  const EGLint config_attributes[] = {
    EGL_SURFACE_TYPE, EGL_PBUFFER_BIT,
    EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT_KHR,
    EGL_RED_SIZE, 8, EGL_GREEN_SIZE, 8, EGL_BLUE_SIZE, 8, EGL_ALPHA_SIZE, 8,
    EGL_NONE
  };
  EGLConfig config = NULL; EGLint config_count = 0;
  if (!eglChooseConfig(display, config_attributes, &config, 1, &config_count) || config_count < 1) {
    fprintf(stderr, "No GLES3 EGL config: 0x%x\n", eglGetError()); return 3;
  }
  const EGLint surface_attributes[] = { EGL_WIDTH, width, EGL_HEIGHT, height, EGL_NONE };
  const EGLint context_attributes[] = { EGL_CONTEXT_CLIENT_VERSION, 3, EGL_NONE };
  EGLSurface surface = eglCreatePbufferSurface(display, config, surface_attributes);
  EGLContext context = eglCreateContext(display, config, EGL_NO_CONTEXT, context_attributes);
  if (surface == EGL_NO_SURFACE || context == EGL_NO_CONTEXT || !eglMakeCurrent(display, surface, surface, context)) {
    fprintf(stderr, "EGL context creation failed: 0x%x\n", eglGetError()); return 3;
  }

  GLuint vertex = compile_shader(GL_VERTEX_SHADER, vertex_source, "vertex");
  GLuint fragment = compile_shader(GL_FRAGMENT_SHADER, fragment_source, "fragment");
  if (!vertex || !fragment) return 4;

  GLuint program = glCreateProgram();
  glAttachShader(program, vertex); glAttachShader(program, fragment); glBindAttribLocation(program, 0, "a_position"); glLinkProgram(program);
  GLint linked = 0; glGetProgramiv(program, GL_LINK_STATUS, &linked);
  if (!linked) {
    GLint length = 0; glGetProgramiv(program, GL_INFO_LOG_LENGTH, &length);
    int capacity = length > 1 ? length : 4096;
    char *log = (char*)calloc((size_t)capacity, 1);
    glGetProgramInfoLog(program, capacity, NULL, log);
    fprintf(stderr, "link failed:\n%s\n", log ? log : "unknown error");
    free(log); return 5;
  }
  glUseProgram(program);

  const GLfloat vertices[] = {-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1};
  GLuint vao = 0, buffer = 0;
  glGenVertexArrays(1, &vao); glBindVertexArray(vao);
  glGenBuffers(1, &buffer); glBindBuffer(GL_ARRAY_BUFFER, buffer);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  glEnableVertexAttribArray(0); glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, NULL);

  for (int index = 6; index < argc; ++index) set_uniform(program, argv[index]);

  glViewport(0, 0, width, height); glClearColor(0, 0, 0, 0); glClear(GL_COLOR_BUFFER_BIT);
  glDrawArrays(GL_TRIANGLES, 0, 6); glFinish();
  GLenum error = glGetError();
  if (error != GL_NO_ERROR) { fprintf(stderr, "GL error after draw: 0x%x\n", error); return 6; }

  size_t pixel_count = (size_t)width * (size_t)height;
  GLubyte *pixels = (GLubyte*)malloc(pixel_count * 4);
  if (!pixels) return 7;
  glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, pixels);

  double sum = 0.0, sum_squares = 0.0, alpha = 0.0;
  for (size_t index = 0; index < pixel_count; ++index) {
    double luminance = pixels[index*4] + pixels[index*4+1] + pixels[index*4+2];
    sum += luminance; sum_squares += luminance * luminance; alpha += pixels[index*4+3];
  }
  double mean = sum / (double)pixel_count;
  double variance = sum_squares / (double)pixel_count - mean * mean;
  double alpha_mean = alpha / (double)pixel_count;

  if (strcmp(output_path, "-") != 0) {
    FILE *output = fopen(output_path, "wb");
    if (!output) { perror(output_path); return 7; }
    fwrite(pixels, 4, pixel_count, output); fclose(output);
  }

  printf("{\"ok\":true,\"mean\":%.6f,\"variance\":%.6f,\"alpha\":%.6f}\n", mean, variance, alpha_mean);

  free(pixels); free(vertex_source); free(fragment_source);
  glDeleteBuffers(1, &buffer); glDeleteVertexArrays(1, &vao); glDeleteProgram(program); glDeleteShader(vertex); glDeleteShader(fragment);
  eglMakeCurrent(display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
  eglDestroyContext(display, context); eglDestroySurface(display, surface); eglTerminate(display);
  return 0;
}
