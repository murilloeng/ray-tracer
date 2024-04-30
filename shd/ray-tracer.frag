#version 460 core

uniform int frame;
uniform int width;
uniform int height;
out vec4 fragment_color;

struct Ray
{
	vec3 m_origin;
	vec3 m_direction;
};
struct Light
{
	vec3 m_color;
	vec3 m_position;
};
struct Material
{
	vec3 m_color;
	float m_reflectivity;
};
struct Hit
{
	int m_id;
	float m_t;
	vec3 m_point;
	vec3 m_normal;
	Material m_material;
};
struct Plane
{
	int m_id;
	vec3 m_point;
	vec3 m_normal;
	Material m_material;
};
struct Sphere
{
	int m_id;
	vec3 m_center;
	float m_radius;
	Material m_material;
};

const float t_min = 1e-5;
const float focal_length = 1;
const int reflection_max = 16;
const vec3 camera_position = vec3(0);

// const int ns = 3;
// const int np = 1;
// const int nl = 1;
// Sphere spheres[ns] = Sphere[ns](
// 	Sphere(0, vec3(-2.0, 0.0, -2.0), 0.5, Material(vec3(1.0, 0.0, 0.0), 0.5)),
// 	Sphere(1, vec3(+0.0, 0.0, -2.0), 0.5, Material(vec3(0.0, 1.0, 0.0), 0.5)),
// 	Sphere(2, vec3(+2.0, 0.0, -2.0), 0.5, Material(vec3(0.0, 0.0, 1.0), 0.5))
// );
// Plane planes[np] = Plane[np](
// 	Plane(3, vec3(0.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0), Material(vec3(0.5, 0.5, 0.5), 0.2))
// );
// Light lights[nl] = Light[nl](
// 	Light(100 * vec3(1, 1, 1), vec3(4 * sin(frame / 100.0), 5, -2))
// );
// Light light_ambient = Light(0.2 * vec3(1, 1, 1), vec3(0));

const int nl_max = 10;
const int ns_max = 10;
const int np_max = 10;
const int scene_index = 0;

int nl;
int ns;
int np;
Light light_ambient;
Light lights[nl_max];
Plane planes[np_max];
Sphere spheres[ns_max];

void scene_1(void)
{
	//data
	nl = 1;
	ns = 3;
	np = 1;
	//lights
	light_ambient = Light(0.2 * vec3(1, 1, 1), vec3(0));
	lights[0] = Light(100 * vec3(1, 1, 1), vec3(4 * sin(frame / 100.0), 5, -2));
	//spheres
	spheres[0] = Sphere(0, vec3(-2.0, 0.0, -2.0), 0.5, Material(vec3(1.0, 0.0, 0.0), 0.5));
	spheres[1] = Sphere(1, vec3(+0.0, 0.0, -2.0), 0.5, Material(vec3(0.0, 1.0, 0.0), 0.5));
	spheres[2] = Sphere(2, vec3(+2.0, 0.0, -2.0), 0.5, Material(vec3(0.0, 0.0, 1.0), 0.5));
	//planes
	planes[0] = Plane(3, vec3(0.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0), Material(vec3(0.5, 0.5, 0.5), 0.2));
}
void scene(void)
{
	if(scene_index == 0) scene_1();
}

bool hit_plane(Ray ray, Plane plane, inout Hit hit)
{
	//ray
	vec3 ro = ray.m_origin;
	vec3 rd = ray.m_direction;
	//plane
	vec3 px = plane.m_point;
	vec3 pn = plane.m_normal;
	//parallel
	if(abs(dot(rd, pn)) < 1e-5) return false;
	//plane hit
	float t = dot(px - ro, pn) / dot(rd, pn);
	hit = Hit(plane.m_id, t, ro + t * rd, pn, plane.m_material);
	//return
	return t > t_min;
}
bool hit_sphere(Ray ray, Sphere sphere, inout Hit hit)
{
	//ray
	vec3 ro = ray.m_origin;
	vec3 rd = ray.m_direction;
	//sphere
	vec3 sc = sphere.m_center;
	float sr = sphere.m_radius;
	//sphere check
	float b = 2 * dot(rd, ro - sc);
	float c = dot(ro - sc, ro - sc) - sr * sr;
	float d = b * b - 4 * c;
	if(d < 0) return false;
	//sphere check
	float t1 = (-b - sqrt(d)) / 2;
	float t2 = (-b + sqrt(d)) / 2;
	if(t1 < t_min && t2 < t_min) return false;
	//sphere hit
	float t = t1 > t_min ? t1 : t2;
	hit = Hit(sphere.m_id, t, ro + t * rd, normalize(ro + t * rd - sc), sphere.m_material);
	//return
	return true;
}

bool ray_intersection(Ray ray, inout Hit hit)
{
	//data
	Hit object_hit;
	bool test = false;
	//objects
	for(int i = 0; i < ns; i++)
	{
		if(hit_sphere(ray, spheres[i], object_hit))
		{
			if(!test || hit.m_t > object_hit.m_t)
			{
				hit = object_hit;
			}
			test = true;
		}
	}
	for(int i = 0; i < np; i++)
	{
		if(hit_plane(ray, planes[i], object_hit))
		{
			if(!test || hit.m_t > object_hit.m_t)
			{
				hit = object_hit;
			}
			test = true;
		}
	}
	//return
	return test;
}
vec3 ray_color(Ray ray)
{
	//data
	Hit hit, hit_shadow;
	vec3 color = vec3(0);
	//color
	if(ray_intersection(ray, hit))
	{
		//lights
		for(int i = 0; i < nl; i++)
		{
			//data
			vec3 u = lights[i].m_position - hit.m_point;
			//shadow
			if(!ray_intersection(Ray(hit.m_point, normalize(u)), hit_shadow))
			{
				color += dot(hit.m_normal, normalize(u)) / dot(u, u) * lights[i].m_color * hit.m_material.m_color;
			}
		}
		//ambient
		color += light_ambient.m_color * hit.m_material.m_color;
		//return
		return color;
	}
	else
	{
		vec3 rd = normalize(ray.m_direction);
		return vec3((1 - rd[1]) / 2, (1 - rd[1]) / 2, 1);
	}
}

void main(void)
{
	//pixel
	vec3 pixel_position;
	pixel_position[2] = -focal_length;
	pixel_position[0] = (2 * gl_FragCoord.x - width) / height;
	pixel_position[1] = (2 * gl_FragCoord.y - height) / height;
	//ray
	scene();
	Ray ray = Ray(camera_position, normalize(pixel_position - camera_position));
	//fragment
	fragment_color = vec4(ray_color(ray), 1);
}