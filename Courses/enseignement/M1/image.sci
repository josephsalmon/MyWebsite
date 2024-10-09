function M = load_image(name)

// read an image from a file


options.null = 0;

filename = name;
fid = mopen(filename, 'rb');
if fid<0
    error('Problem with file loading.');
end
n = mget(1, 'us', fid);
p = mget(1, 'us', fid);
M = mget(n*p, 'uc', fid);
mclose(fid);
if length(M)~=n*p
    error('Problem with file loading.');
end
M = matrix(M, n, p);

endfunction;

function set_colormap()

f=gcf(); 
f.color_map=graycolormap(256); 


endfunction;


