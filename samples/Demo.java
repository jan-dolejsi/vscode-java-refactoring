// Option 1
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;

// Option 2
// @Slf4j
public class Demo {
    
    // Option 1
    // final static Logger logger = LoggerFactory.getLogger(Demo.class);

    public static void main(String[] args) {
        System.out.println("Simple");
        System.out.println("Text is \"double-quoted\"");
        System.out.println("Text is 'single-quoted'");
        System.out.println('a');
        System.out.println(
            "multi line"
        );
        System.out.println("One " + '1');
        System.out.println("One " + 1);
        int var1 = 1;
        int var2 = 2;
        System.out.println("Var1=" + var1 + ", var2=" + var2);
        System.out.println(123);
        System.out.println(methodCall("Simple+ASDF"));

        System.err.print('E');
    }

    private static String methodCall(String string) {
        return null;
    }
}
