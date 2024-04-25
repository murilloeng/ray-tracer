#compiler
CXX = g++
INCS += -I ..
LIBS += -l GL -l GLEW -l glut
WARS += -Wall -Wno-unused-result
CXXFLAGS += -std=c++20 -fPIC -pipe -fopenmp -MT $@ -MMD -MP -MF $(subst .o,.d, $@) $(DEFS) $(INCS) $(WARS)

#mode
ifneq ($(m), r)
	mode = debug
	CXXFLAGS += -ggdb3
else
	mode = release
	CXXFLAGS += -Ofast
endif

#ouput
out = dist/$(mode)/ray-tracer.out

#sources
src := $(sort $(shell find -path './src/*.cpp'))

#objects
obj := $(sort $(subst ./src/, build/$(mode)/, $(addsuffix .o, $(basename $(src)))))

#dependencies
dep := $(subst .o,.d, $(obj))

#rules
all : $(out)
	@echo 'build($(mode)): complete!'

run : $(out)
	@./$(out)

debug : 
	@gdb $(out) -x gdb.txt

$(out) : $(obj)
	@echo 'executable($(mode)): $@'
	@mkdir -p $(dir $@) && rm -rf $@
	@$(CXX) -fopenmp -o $(out) $(obj) $(LIBS)

build/$(mode)/%.o : src/%.cpp build/$(mode)/%.d
	@echo 'compiling($(mode)): $<'
	@mkdir -p $(dir $@) && rm -rf $@
	@$(CXX) $(CXXFLAGS) -c $< -o $@

$(dep) : ;

-include $(dep)

clean :
	@rm -rf dist/$(mode)
	@rm -rf build/$(mode)
	@echo 'clean($(mode)): complete!'

print-% :
	@echo $* = $($*)

.PHONY : all run clean print-%