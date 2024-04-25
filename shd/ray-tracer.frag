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

const int iterations = 16;
const float focal_length = 1.0;
const vec3 camera_position = vec3(0.0);
Light light = Light(vec3(1.0, 1.0, 1.0), vec3(0, 5.0, -2.0));

const int ns = 3;
Sphere spheres[ns] = Sphere[ns](
	Sphere(0, vec3(-2.0, 0.0, -2.0), 0.5, Material(vec3(1.0, 0.0, 0.0))),
	Sphere(1, vec3(+0.0, 0.0, -2.0), 0.5, Material(vec3(0.0, 1.0, 0.0))),
	Sphere(2, vec3(+2.0, 0.0, -2.0), 0.5, Material(vec3(0.0, 0.0, 1.0)))
);
Plane plane = Plane(3, vec3(0.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0), Material(vec3(0.5, 0.5, 0.5)));

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
	//behind
	float t = dot(px - ro, pn) / dot(rd, pn);
	if(t < 0.0) return false;
	//hit
	hit = Hit(plane.m_id, t, ro + t * rd, pn, plane.m_material);
	return true;
}
bool hit_sphere(Ray ray, Sphere sphere, inout Hit hit)
{
	//ray
	vec3 ro = ray.m_origin;
	vec3 rd = ray.m_direction;
	//sphere
	vec3 sc = sphere.m_center;
	float sr = sphere.m_radius;
	//hit
	float a = dot(rd, rd);
	float b = 2.0 * dot(rd, ro - sc);
	float c = dot(ro - sc, ro - sc) - sr * sr;
	float d = b * b - 4.0 * a * c;
	if(d < 0.0)
	{
		return false;
	}
	else
	{
		float t1 = (-b - sqrt(d)) / 2.0 / a;
		float t2 = (-b + sqrt(d)) / 2.0 / a;
		if(t1 < 0.0 && t2 < 0.0) return false;
		float t = t1 > 0.0 ? t1 : t2;
		hit = Hit(sphere.m_id, t, ro + t * rd, normalize(ro + t * rd - sc), sphere.m_material);
		return true;
	}
}

bool ray_intersection(Ray ray, inout Hit hit, int id)
{
	//data
	Hit object_hit;
	bool test = false;
	//objects
	for(int i = 0; i < ns; i++)
	{
		if(spheres[i].m_id != id && hit_sphere(ray, spheres[i], object_hit))
		{
			if(!test || hit.m_t > object_hit.m_t)
			{
				hit = object_hit;
			}
			test = true;
		}
	}
	if(plane.m_id != id && hit_plane(ray, plane, object_hit))
	{
		if(!test || hit.m_t > object_hit.m_t)
		{
			hit = object_hit;
		}
		test = true;
	}
	//return
	return test;
}
vec3 ray_color(Ray ray)
{
	//data
	Hit hit;
	vec3 rd = normalize(ray.m_direction);
	//intersection
	if(ray_intersection(ray, hit, -1))
	{
		Hit hit_light;
		Ray ray_light = Ray(hit.m_point, light.m_position - hit.m_point);
		if(ray_intersection(ray_light, hit_light, hit.m_id))
		{
			return vec3(0.0);
		}
		else
		{
			vec3 ld = normalize(light.m_position - hit.m_point);
			return max(dot(ld, hit.m_normal), 0.0) * hit.m_material.m_color;
		}
	}
	else
	{
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
	Ray ray = Ray(camera_position, pixel_position - camera_position);
	//fragment
	fragment_color = vec4(ray_color(ray), 1);
}